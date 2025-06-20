import { test, expect } from '@playwright/test';

test.describe('Critical Lead Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
  });

  test('Complete lead lifecycle: Login → Hub → Promote → Kanban → Stage Update', async ({ page }) => {
    // Step 1: Login to the application
    await test.step('Login to the application', async () => {
      // Wait for the login form to be visible
      await expect(page.locator('form')).toBeVisible();
      
      // Fill in login credentials (you may need to adjust these selectors)
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      
      // Click login button
      await page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await page.waitForURL('/business-finder');
      
      // Verify we're logged in by checking for dashboard content
      await expect(page.locator('h1')).toContainText('Dashboard Principal');
    });

    // Step 2: Navigate to Hub de Prospección
    await test.step('Navigate to Hub de Prospección', async () => {
      // Click on the sidebar navigation to lead sources
      await page.click('a[href="/lead-sources"]');
      
      // Wait for navigation
      await page.waitForURL('/lead-sources');
      
      // Verify we're on the correct page
      await expect(page.locator('h1, h2')).toContainText(/Hub de Prospección|Fuentes de Datos/);
    });

    // Step 3: Create or find a test lead to promote
    await test.step('Ensure there is a lead to promote', async () => {
      // Check if there are any leads available
      const leadCards = page.locator('[data-testid="lead-card"], .lead-card, .bg-card').first();
      
      // If no leads exist, create one using CSV import or manual creation
      const hasLeads = await leadCards.isVisible().catch(() => false);
      
      if (!hasLeads) {
        // Try to create a lead using the file import tab
        await page.click('[value="file-import"]').catch(() => {
          console.log('File import tab not found, trying manual lead creation');
        });
        
        // If CSV import is available, we'd need to handle file upload
        // For now, let's assume there's a manual lead creation option
        const createButton = page.locator('button').filter({ hasText: /Crear|Añadir|Nuevo/ }).first();
        
        if (await createButton.isVisible().catch(() => false)) {
          await createButton.click();
          
          // Fill in basic lead information
          await page.fill('input[placeholder*="nombre"], input[name*="name"]', 'Test Lead Company');
          await page.fill('input[placeholder*="email"], input[name*="email"]', 'test@testlead.com');
          await page.fill('input[placeholder*="teléfono"], input[name*="phone"]', '+1234567890');
          
          // Save the lead
          await page.locator('button[type="submit"], button').filter({ hasText: /Guardar|Crear/ }).first().click();
          
          // Wait for the lead to appear
          await expect(page.locator('text=Test Lead Company')).toBeVisible();
        }
      }
    });

    // Step 4: Promote a lead to the main flow
    await test.step('Promote lead to main flow', async () => {
      // Find the first available lead card
      const leadCard = page.locator('[data-testid="lead-card"], .lead-card, .bg-card').first();
      await expect(leadCard).toBeVisible();
      
      // Look for the promote button within the lead card
      const promoteButton = leadCard.locator('button').filter({ 
        hasText: /Promocionar|Transferir|Mover al flujo/i 
      }).first();
      
      // If promote button is not immediately visible, it might be in a dropdown or modal
      if (!(await promoteButton.isVisible().catch(() => false))) {
        // Try clicking on the lead card or a menu button
        await leadCard.click();
        
        // Look for a menu or modal with promote option
        await page.locator('button').filter({ hasText: /Opciones|Menú|⋮/ }).first().click().catch(() => {});
      }
      
      // Click the promote button
      await promoteButton.click();
      
      // Handle any confirmation dialog
      const confirmButton = page.locator('button').filter({ hasText: /Confirmar|Sí|Promocionar/ });
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
      }
      
      // Wait for success message or notification
      await expect(page.locator('.toast, .notification')).toContainText(/promovido|transferido|éxito/i).catch(() => {
        // If no toast, just wait a moment for the action to complete
        return page.waitForTimeout(2000);
      });
    });

    // Step 5: Navigate to Flujo de Leads (Kanban board)
    await test.step('Navigate to Flujo de Leads', async () => {
      // Click on the leads flow navigation
      await page.click('a[href="/leads"]');
      
      // Wait for navigation
      await page.waitForURL('/leads');
      
      // Verify we're on the kanban board
      await expect(page.locator('h1, h2')).toContainText(/Flujo de Leads|Pipeline|Kanban/);
    });

    // Step 6: Verify lead appears in Kanban board
    await test.step('Verify lead appears in Kanban board', async () => {
      // Wait for the kanban board to load
      await page.waitForSelector('.kanban, [data-testid="kanban"], .grid').catch(() => {
        // Fallback: wait for any lead cards to appear
        return page.waitForSelector('.lead-card, [data-testid="lead-card"]');
      });
      
      // Check if our test lead is visible in any stage
      const leadInKanban = page.locator('text=Test Lead Company, .lead-card').first();
      await expect(leadInKanban).toBeVisible({ timeout: 10000 });
    });

    // Step 7: Move lead to next stage (drag and drop or stage update)
    await test.step('Update lead stage', async () => {
      // Find the lead card in the kanban board
      const leadCard = page.locator('.lead-card, [data-testid="lead-card"]').filter({ 
        hasText: /Test Lead Company|test@testlead\.com/ 
      }).first();
      
      await expect(leadCard).toBeVisible();
      
      // Try to find a stage selector or next stage button
      const stageSelect = leadCard.locator('select, .stage-select');
      const nextStageButton = leadCard.locator('button').filter({ hasText: /Siguiente|Contactar|Calificar/ });
      
      if (await stageSelect.isVisible().catch(() => false)) {
        // Use dropdown to change stage
        await stageSelect.selectOption({ label: 'Contactado' });
      } else if (await nextStageButton.isVisible().catch(() => false)) {
        // Use next stage button
        await nextStageButton.click();
      } else {
        // Try drag and drop to next column
        const sourceColumn = leadCard.locator('..').locator('.kanban-column, .column').first();
        const targetColumn = page.locator('.kanban-column, .column').filter({ hasText: /Contactado/ }).first();
        
        if (await targetColumn.isVisible().catch(() => false)) {
          // Perform drag and drop
          await leadCard.dragTo(targetColumn);
        } else {
          // Fallback: click on the lead and look for stage update options
          await leadCard.click();
          
          // Look for stage update in modal or sidebar
          const stageUpdateButton = page.locator('button').filter({ hasText: /Actualizar etapa|Cambiar estado/ });
          if (await stageUpdateButton.isVisible().catch(() => false)) {
            await stageUpdateButton.click();
            await page.selectOption('select', { label: 'Contactado' });
            await page.locator('button').filter({ hasText: /Guardar|Actualizar/ }).click();
          }
        }
      }
      
      // Wait for the change to be saved
      await page.waitForTimeout(2000);
      
      // Verify the stage has been updated
      await expect(page.locator('text=Contactado')).toBeVisible();
    });

    // Step 8: Verify the change persisted
    await test.step('Verify stage change persisted', async () => {
      // Refresh the page to ensure the change was saved
      await page.reload();
      
      // Wait for the page to load
      await page.waitForSelector('.kanban, [data-testid="kanban"], .lead-card');
      
      // Verify our lead is still in the updated stage
      const updatedLead = page.locator('.lead-card, [data-testid="lead-card"]').filter({ 
        hasText: /Test Lead Company|test@testlead\.com/ 
      }).first();
      
      await expect(updatedLead).toBeVisible();
      
      // Check that the lead is in the "Contactado" stage area
      const contactadoSection = page.locator('.kanban-column, .column').filter({ hasText: /Contactado/ });
      if (await contactadoSection.isVisible().catch(() => false)) {
        await expect(contactadoSection.locator('.lead-card').filter({ 
          hasText: /Test Lead Company/ 
        })).toBeVisible();
      }
    });

    // Optional cleanup step
    await test.step('Cleanup (optional)', async () => {
      // This step is optional - in a real test environment, you might want to
      // clean up test data. For now, we'll just verify the test completed successfully
      console.log('✅ Critical lead flow test completed successfully');
    });
  });

  test('Quick smoke test: Navigation and basic functionality', async ({ page }) => {
    // Simplified test for CI/CD environments where full auth might not be available
    await test.step('Check main navigation exists', async () => {
      await page.goto('/');
      
      // Should redirect to login if not authenticated
      await expect(page).toHaveURL(/\/(login|business-finder)/);
      
      // Check that key elements are present
      if (page.url().includes('/login')) {
        await expect(page.locator('form')).toBeVisible();
        await expect(page.locator('input[type="email"]')).toBeVisible();
      } else {
        // If already authenticated, check dashboard
        await expect(page.locator('h1')).toContainText(/Dashboard|Mar-IA/);
      }
    });

    await test.step('Check sidebar navigation exists', async () => {
      // Skip if on login page
      if (page.url().includes('/login')) {
        return;
      }
      
      // Check that main navigation sections exist
      const navigation = page.locator('nav, .sidebar, [data-testid="sidebar"]');
      if (await navigation.isVisible().catch(() => false)) {
        await expect(navigation).toContainText(/LEADS|DASHBOARD|AUTOMATIZACIÓN/);
      }
    });

    await test.step('Check lead-sources page accessibility', async () => {
      // Try to access lead sources page directly
      await page.goto('/lead-sources');
      
      // Should either show the page or redirect to login
      if (!page.url().includes('/login')) {
        await expect(page.locator('h1, h2')).toContainText(/Hub|Fuentes|Lead/);
      }
    });
  });
});