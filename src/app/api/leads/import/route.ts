import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { LeadSource, LeadStage, LeadStatus, BusinessType } from '@/types/unified-lead';
import Papa from 'papaparse';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
    return { error: 'Firebase Admin SDK not initialized', status: 500 };
  }

  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { error: 'No autorizado: Token faltante o inválido', status: 401 };
  }

  const token = authorizationHeader.split('Bearer ')[1];
  try {
    const decodedToken = await authAdmin.verifyIdToken(token);
    if (!decodedToken.uid) {
      return { error: 'No autorizado: UID no encontrado en el token', status: 401 };
    }
    return { uid: decodedToken.uid };
  } catch (error) {
    console.error('Error verifying token:', error);
    return { error: 'No autorizado: Token inválido', status: 401 };
  }
}

// Utility functions for type conversion
function getBusinessTypeFromString(businessType?: string): BusinessType {
  if (!businessType) return BusinessType.GENERAL;
  
  const normalized = businessType.toLowerCase();
  
  if (normalized.includes('restaurant') || normalized.includes('comida')) return BusinessType.RESTAURANT;
  if (normalized.includes('auto') || normalized.includes('vehic')) return BusinessType.AUTOMOTIVE;
  if (normalized.includes('inmobil') || normalized.includes('casa') || normalized.includes('property')) return BusinessType.REAL_ESTATE;
  if (normalized.includes('salud') || normalized.includes('medic') || normalized.includes('health')) return BusinessType.HEALTH;
  if (normalized.includes('tienda') || normalized.includes('retail') || normalized.includes('shop')) return BusinessType.RETAIL;
  if (normalized.includes('servicio') || normalized.includes('service')) return BusinessType.SERVICES;
  if (normalized.includes('tech') || normalized.includes('software') || normalized.includes('tecnolog')) return BusinessType.TECHNOLOGY;
  if (normalized.includes('educac') || normalized.includes('escuela') || normalized.includes('education')) return BusinessType.EDUCATION;
  if (normalized.includes('financ') || normalized.includes('banco') || normalized.includes('finance')) return BusinessType.FINANCE;
  
  return BusinessType.GENERAL;
}

function getLeadStageFromString(stage?: string): LeadStage {
  if (!stage) return LeadStage.NEW;
  
  const normalized = stage.toLowerCase();
  switch (normalized) {
    case 'nuevo': case 'new': return LeadStage.NEW;
    case 'contactado': case 'contacted': return LeadStage.CONTACTED;
    case 'calificado': case 'qualified': return LeadStage.QUALIFIED;
    case 'propuesta enviada': case 'proposal sent': case 'propuesta_enviada': return LeadStage.PROPOSAL_SENT;
    case 'negociación': case 'negotiation': case 'negociacion': return LeadStage.NEGOTIATION;
    case 'ganado': case 'won': return LeadStage.WON;
    case 'perdido': case 'lost': return LeadStage.LOST;
    case 'prospecto': case 'prospect': return LeadStage.PROSPECT;
    case 'interesado': case 'interested': return LeadStage.INTERESTED;
    case 'propuesta': case 'proposal': return LeadStage.PROPOSAL;
    case 'vendido': case 'sold': return LeadStage.SOLD;
    default: return LeadStage.NEW;
  }
}

// Parse multipart form data
async function parseFormData(req: NextRequest): Promise<{ fields: any; files: any }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    form.parse(req as any, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}

// Apply dynamic mapping to CSV row
function applyMapping(csvRow: any, mappings: Record<string, string>, uid: string, organizationId: string) {
  const mappedLead: any = {
    // Default values
    stage: LeadStage.NEW,
    source: LeadSource.CSV_IMPORT,
    status: LeadStatus.ACTIVE,
    uid,
    organizationId,
    sourceData: {
      type: 'import',
      importType: 'csv',
      fileName: 'csv_import',
      importedAt: new Date().toISOString(),
      createdBy: uid
    },
    metadata: {
      version: '1.0',
      tags: ['import', 'csv'],
      automation: {
        enabled: true
      }
    }
  };

  // Apply user-defined mappings
  for (const csvHeader in mappings) {
    const unifiedField = mappings[csvHeader];
    const value = csvRow[csvHeader];
    
    if (value && value.toString().trim() !== '') {
      switch (unifiedField) {
        case 'fullName':
          mappedLead.fullName = value.toString().trim();
          break;
        case 'email':
          mappedLead.email = value.toString().trim().toLowerCase();
          break;
        case 'phone':
          mappedLead.phone = value.toString().trim();
          break;
        case 'company':
          mappedLead.company = value.toString().trim();
          break;
        case 'address':
          mappedLead.address = {
            formatted: value.toString().trim()
          };
          break;
        case 'website':
          mappedLead.website = value.toString().trim();
          break;
        case 'businessType':
          mappedLead.businessType = getBusinessTypeFromString(value.toString());
          break;
        case 'stage':
          mappedLead.stage = getLeadStageFromString(value.toString());
          break;
        case 'estimatedValue':
          const numValue = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
          if (!isNaN(numValue)) {
            mappedLead.estimatedValue = numValue;
          }
          break;
        case 'notes':
          mappedLead.notes = value.toString().trim();
          break;
        case 'leadScore':
          const scoreValue = parseFloat(value.toString());
          if (!isNaN(scoreValue)) {
            mappedLead.leadScore = scoreValue;
          }
          break;
        default:
          // Store unmapped fields in metadata
          if (!mappedLead.metadata.customFields) {
            mappedLead.metadata.customFields = {};
          }
          mappedLead.metadata.customFields[csvHeader] = value.toString().trim();
      }
    }
  }

  // Ensure required fields have defaults
  if (!mappedLead.fullName) {
    mappedLead.fullName = 'Lead Importado';
  }

  return mappedLead;
}

// === POST: Import CSV with dynamic mapping ===
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.error 
      }, { status: authResult.status });
    }

    const contentType = request.headers.get('content-type') || '';
    
    // Handle multipart/form-data (CSV upload with mappings)
    if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseFormData(request);
      
      // Extract data from form
      const organizationId = Array.isArray(fields.organizationId) ? fields.organizationId[0] : fields.organizationId;
      const mappingsStr = Array.isArray(fields.mappings) ? fields.mappings[0] : fields.mappings;
      const csvFile = Array.isArray(files.csvFile) ? files.csvFile[0] : files.csvFile;

      if (!organizationId) {
        return NextResponse.json({ 
          success: false, 
          message: 'organizationId es requerido' 
        }, { status: 400 });
      }

      if (!mappingsStr) {
        return NextResponse.json({ 
          success: false, 
          message: 'mappings son requeridos' 
        }, { status: 400 });
      }

      if (!csvFile) {
        return NextResponse.json({ 
          success: false, 
          message: 'Archivo CSV es requerido' 
        }, { status: 400 });
      }

      // Parse mappings
      let mappings: Record<string, string>;
      try {
        mappings = JSON.parse(mappingsStr);
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          message: 'Error parseando mappings JSON' 
        }, { status: 400 });
      }

      // Read and parse CSV file
      const csvContent = fs.readFileSync(csvFile.filepath, 'utf-8');
      
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      });

      if (parseResult.errors.length > 0) {
        console.error('CSV parsing errors:', parseResult.errors);
        return NextResponse.json({ 
          success: false, 
          message: 'Error parseando archivo CSV',
          errors: parseResult.errors 
        }, { status: 400 });
      }

      const csvData = parseResult.data as any[];
      
      if (csvData.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'El archivo CSV está vacío o no tiene datos válidos' 
        }, { status: 400 });
      }

      // Generate batch ID for this import
      const batchId = `import_${Date.now()}_${authResult.uid}`;
      
      // Process and save leads
      const batch = firestoreDbAdmin.batch();
      const importedLeadsCollection = firestoreDbAdmin.collection('imported-leads');
      let savedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < csvData.length; i++) {
        try {
          const csvRow = csvData[i];
          const mappedLead = applyMapping(csvRow, mappings, authResult.uid, organizationId);
          
          // Validate required fields
          if (!mappedLead.fullName && !mappedLead.email) {
            errors.push(`Fila ${i + 2}: Lead sin nombre ni email válido`);
            continue;
          }

          // Check for duplicates in imported-leads collection
          const existingLeadQuery = await firestoreDbAdmin
            .collection('imported-leads')
            .where('organizationId', '==', organizationId)
            .where('email', '==', mappedLead.email || '')
            .limit(1)
            .get();

          if (!existingLeadQuery.empty && mappedLead.email) {
            console.log(`Lead ${mappedLead.fullName} (${mappedLead.email}) already exists in imports. Skipping.`);
            continue;
          }

          // Add import-specific fields
          const importedLead = {
            ...mappedLead,
            leadId: `imported_${batchId}_${i}`,
            sourceId: `csv_row_${i}`,
            batchId,
            importedAt: FieldValue.serverTimestamp(),
            rowNumber: i + 2, // +2 because CSV starts at row 1 and we skip header
            originalData: csvRow, // Keep original data for reference
            isPromoted: false,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          };

          const leadDocRef = importedLeadsCollection.doc();
          batch.set(leadDocRef, importedLead);
          savedCount++;

        } catch (error: any) {
          errors.push(`Fila ${i + 2}: ${error.message}`);
        }
      }

      // Commit batch
      if (savedCount > 0) {
        await batch.commit();
        console.log(`Successfully imported ${savedCount} leads for UID: ${authResult.uid}`);
      }

      // Clean up uploaded file
      try {
        fs.unlinkSync(csvFile.filepath);
      } catch (error) {
        console.warn('Could not delete temp file:', error);
      }

      const response = { 
        success: true,
        message: `${savedCount} lead(s) importados correctamente`,
        saved: savedCount,
        total: csvData.length,
        batchId,
        errors: errors.length > 0 ? errors : undefined
      };

      return NextResponse.json(response, { status: 201 });
    }
    
    // Handle JSON data (legacy support)
    else {
      const body = await request.json();
      const { leads, organizationId } = body as { leads: any[]; organizationId: string };

      if (!Array.isArray(leads) || leads.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'No se proporcionaron leads válidos.' 
        }, { status: 400 });
      }

      if (!organizationId) {
        return NextResponse.json({ 
          success: false, 
          message: 'organizationId es requerido.' 
        }, { status: 400 });
      }

      console.log(`Importing ${leads.length} leads for UID: ${authResult.uid}, Organization: ${organizationId}`);

      const batch = firestoreDbAdmin.batch();
      const leadsCollection = firestoreDbAdmin.collection('leads-flow');
      let savedCount = 0;
      const errors: string[] = [];

      for (const lead of leads) {
        try {
          // Validate required fields
          if (!lead.fullName || !lead.email) {
            errors.push(`Lead sin nombre o email válido: ${lead.fullName || 'Sin nombre'}`);
            continue;
          }

          // Check for duplicates based on email and organization
          const existingLeadQuery = await firestoreDbAdmin
            .collection('leads-flow')
            .where('organizationId', '==', organizationId)
            .where('email', '==', lead.email)
            .limit(1)
            .get();

          if (!existingLeadQuery.empty) {
            console.log(`Lead ${lead.fullName} (${lead.email}) already exists. Skipping.`);
            continue;
          }

          const leadDocRef = leadsCollection.doc();
          const timestamp = FieldValue.serverTimestamp();
          
          // Map to UnifiedLead structure
          const unifiedLead = {
            leadId: leadDocRef.id,
            sourceId: leadDocRef.id,
            fullName: lead.fullName,
            email: lead.email,
            phone: lead.phoneNumber || null,
            company: lead.companyName || null,
            address: lead.address ? {
              formatted: lead.address
            } : undefined,
            businessType: getBusinessTypeFromString(),
            stage: getLeadStageFromString(lead.currentStage || 'Nuevo'),
            source: LeadSource.CSV_IMPORT,
            status: LeadStatus.ACTIVE,
            estimatedValue: lead.estimatedValue || 0,
            sourceData: {
              type: 'import',
              importType: 'csv',
              fileName: 'bulk_import',
              importedAt: new Date().toISOString(),
              createdBy: authResult.uid
            },
            notes: lead.notes || '',
            metadata: {
              version: '1.0',
              tags: ['import', 'csv'],
              automation: {
                enabled: true
              }
            },
            currentStage: lead.currentStage || 'Nuevo',
            phoneNumber: lead.phoneNumber || '',
            companyName: lead.companyName || '',
            createdAt: timestamp,
            updatedAt: timestamp,
            uid: authResult.uid,
            organizationId,
            stageHistory: [{
              stage: lead.currentStage || 'Nuevo',
              enteredAt: new Date().toISOString(),
              triggeredBy: 'import',
              userId: authResult.uid,
              notes: `Lead importado`
            }]
          };

          batch.set(leadDocRef, unifiedLead);
          savedCount++;

        } catch (error: any) {
          errors.push(`Error procesando lead ${lead.fullName}: ${error.message}`);
        }
      }

      if (savedCount > 0) {
        await batch.commit();
        console.log(`Successfully imported ${savedCount} leads for UID: ${authResult.uid}`);
      }

      const response: any = { 
        success: true,
        message: `${savedCount} lead(s) importados correctamente`,
        saved: savedCount,
        total: leads.length
      };

      if (errors.length > 0) {
        response.errors = errors;
        response.message += ` (${errors.length} errores)`;
      }

      return NextResponse.json(response, { status: 201 });
    }

  } catch (error: any) {
    console.error('Error al importar leads:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Error al importar leads', 
      error: error.message || 'Error desconocido'
    }, { status: 500 });
  }
}