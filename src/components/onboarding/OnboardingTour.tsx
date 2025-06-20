"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import Shepherd from 'shepherd.js';
import type { Tour, Step } from 'shepherd.js';

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface OnboardingTourProps {
  run: boolean;
  onComplete: () => void;
  theme?: 'light' | 'dark' | 'auto';
  language?: 'es' | 'en';
}

interface TourStep {
  id: string;
  title: string;
  content: string;
  badge: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface TourTheme {
  overlay: string;
  background: string;
  text: string;
  border: string;
  primary: string;
  secondary: string;
}

// ==========================================
// CONSTANTS & CONFIGURATION
// ==========================================

const TOUR_CONFIG = {
  useModalOverlay: true,
  exitOnEsc: true,
  keyboardNavigation: true,
  defaultStepOptions: {
    classes: 'shepherd-theme-maria',
    scrollTo: { 
      behavior: 'smooth' as ScrollBehavior, 
      block: 'center' as ScrollLogicalPosition 
    },
    modalOverlayOpeningPadding: 12,
    modalOverlayOpeningRadius: 12,
    when: {
      show(this: Step) {
        // Animación de entrada
        this.getElement()?.classList.add('shepherd-animate-in');
      }
    }
  }
} as const;

// ==========================================
// TOUR STEPS DATA
// ==========================================

const TOUR_STEPS: Record<string, TourStep[]> = {
  es: [
    {
      id: 'leads-intro',
      title: 'Sección LEADS',
      badge: '🎯 Centro de prospección',
      content: `
        <strong>Aquí empieza todo.</strong> La sección LEADS centraliza la captación 
        y gestión de tus prospectos desde múltiples fuentes. Es tu comando central 
        para el crecimiento de tu negocio.
      `,
      target: '[data-onboarding="leads-section"]',
      position: 'right'
    },
    {
      id: 'hub-prospeccion',
      title: 'Hub de Prospección',
      badge: '📊 Gestión de fuentes',
      content: `
        En el <strong>"Hub de Prospección"</strong>, puedes:
        <ul class="tour-feature-list">
          <li>📁 Importar leads desde archivos CSV</li>
          <li>🔍 Buscar nuevos negocios en Google Places</li>
          <li>📱 Gestionar leads de Meta Ads</li>
        </ul>
        Una vez calificados, <strong>promociónalos a tu flujo de ventas</strong>.
      `,
      target: '[data-onboarding="hub-prospeccion"]',
      position: 'right'
    },
    {
      id: 'flujo-leads',
      title: 'Flujo de Leads',
      badge: '🔄 Pipeline de ventas',
      content: `
        En <strong>"Flujo de Leads"</strong> gestionas tu pipeline principal:
        <ul class="tour-feature-list">
          <li>📋 Mover leads entre etapas</li>
          <li>📈 Hacer seguimiento del progreso</li>
          <li>💰 Cerrar ventas exitosamente</li>
        </ul>
      `,
      target: '[data-onboarding="flujo-leads"]',
      position: 'right'
    },
    {
      id: 'ventas-section',
      title: 'Sección VENTAS',
      badge: '💰 Cotizaciones inteligentes',
      content: `
        Cuando un lead esté listo para comprar, usa la <strong>sección VENTAS</strong> para:
        <ul class="tour-feature-list">
          <li>🤖 Generar cotizaciones con IA</li>
          <li>📄 Integrar con PandaDoc</li>
          <li>✨ Crear documentos profesionales</li>
        </ul>
      `,
      target: '[data-onboarding="ventas-section"]',
      position: 'right'
    },
    {
      id: 'automatizacion',
      title: 'AUTOMATIZACIÓN',
      badge: '⚡ Funcionalidad avanzada',
      content: `
        <strong>Esta es la joya de la corona:</strong> crea flujos de trabajo 
        visuales con CONEX para automatizar cualquier tarea. Desde seguimiento 
        de leads hasta integración con herramientas externas.
      `,
      target: '[data-onboarding="automatización-section"]',
      position: 'right'
    },
    {
      id: 'final',
      title: '¡Listo para empezar!',
      badge: '🚀 Tour completado',
      content: `
        ¡Perfecto! Ya conoces las funciones principales de Mar-IA.
        <br><br>
        Explora la <strong>sección de CONFIGURACIÓN</strong> para personalizar 
        la plataforma según tus necesidades específicas.
      `,
      target: '[data-onboarding="configuración-section"]',
      position: 'right'
    }
  ]
};

// ==========================================
// CUSTOM HOOKS
// ==========================================

const useTheme = (theme: 'light' | 'dark' | 'auto' = 'auto'): TourTheme => {
  const [currentTheme, setCurrentTheme] = React.useState<TourTheme>({
    overlay: 'rgba(0, 0, 0, 0.4)',
    background: 'hsl(var(--card))',
    text: 'hsl(var(--card-foreground))',
    border: 'hsl(var(--border))',
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))'
  });

  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = (e: MediaQueryListEvent) => {
        // Theme auto-detection logic
        setCurrentTheme(prev => ({
          ...prev,
          overlay: e.matches ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)'
        }));
      };
      
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  return currentTheme;
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const createTourStyles = (theme: TourTheme): string => `
  /* Reset & Base Styles */
  .shepherd-modal-overlay-container {
    z-index: 1000;
    backdrop-filter: blur(6px);
    background: ${theme.overlay};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Tour Element */
  .shepherd-element {
    z-index: 1001;
    border-radius: 16px;
    box-shadow: 
      0 32px 64px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px ${theme.border};
    background: ${theme.background};
    border: none;
    color: ${theme.text};
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 480px;
    min-width: 360px;
    overflow: hidden;
    transform: scale(0.95);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .shepherd-element.shepherd-animate-in {
    transform: scale(1);
  }

  /* Content Container */
  .shepherd-content {
    padding: 32px;
  }

  /* Title Styling */
  .shepherd-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 20px;
    color: ${theme.text};
    line-height: 1.2;
    letter-spacing: -0.025em;
  }

  /* Text Content */
  .shepherd-text {
    line-height: 1.7;
    margin-bottom: 0;
    color: hsl(var(--muted-foreground));
    font-size: 15px;
  }

  /* Footer */
  .shepherd-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 24px 32px;
    background: hsl(var(--muted) / 0.05);
    border-top: 1px solid ${theme.border};
    margin: 0;
  }

  /* Progress Indicator */
  .tour-progress {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: hsl(var(--muted-foreground));
    font-weight: 500;
  }

  .tour-progress-bar {
    width: 80px;
    height: 4px;
    background: hsl(var(--muted));
    border-radius: 2px;
    overflow: hidden;
  }

  .tour-progress-fill {
    height: 100%;
    background: ${theme.primary};
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  /* Button Group */
  .tour-button-group {
    display: flex;
    gap: 12px;
  }

  /* Button Styles */
  .shepherd-button {
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    min-width: 100px;
    position: relative;
    overflow: hidden;
  }

  .shepherd-button::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.6s;
  }

  .shepherd-button:hover::before {
    transform: translateX(100%);
  }

  .btn-primary {
    background: linear-gradient(135deg, ${theme.primary}, hsl(var(--primary) / 0.8));
    color: hsl(var(--primary-foreground));
    box-shadow: 0 4px 12px hsl(var(--primary) / 0.25);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px hsl(var(--primary) / 0.35);
  }

  .btn-secondary {
    background: ${theme.secondary};
    color: hsl(var(--secondary-foreground));
    border: 1px solid ${theme.border};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .btn-secondary:hover {
    background: hsl(var(--secondary) / 0.8);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  /* Close Button */
  .shepherd-cancel-icon {
    background: transparent;
    border: none;
    color: hsl(var(--muted-foreground));
    cursor: pointer;
    font-size: 20px;
    position: absolute;
    right: 16px;
    top: 16px;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s ease;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .shepherd-cancel-icon:hover {
    color: ${theme.text};
    background: hsl(var(--muted) / 0.6);
    transform: rotate(90deg);
  }

  /* Badge */
  .tour-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 20px;
    background: linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05));
    color: ${theme.primary};
    font-size: 13px;
    font-weight: 600;
    border: 1px solid hsl(var(--primary) / 0.2);
    margin-bottom: 16px;
    width: fit-content;
  }

  /* Feature List */
  .tour-feature-list {
    margin: 16px 0;
    padding: 0;
    list-style: none;
  }

  .tour-feature-list li {
    padding: 8px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: hsl(var(--muted-foreground));
  }

  /* Animations */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .shepherd-text > * {
    animation: fadeInUp 0.5s ease forwards;
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .shepherd-element {
      max-width: calc(100vw - 32px);
      min-width: calc(100vw - 32px);
      margin: 16px;
    }
    
    .shepherd-content,
    .shepherd-footer {
      padding: 24px;
    }
    
    .shepherd-title {
      font-size: 20px;
    }
    
    .tour-button-group {
      flex-direction: column;
    }
    
    .shepherd-button {
      width: 100%;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .shepherd-element {
      border: 2px solid ${theme.text};
    }
    
    .btn-primary {
      border: 2px solid hsl(var(--primary-foreground));
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .shepherd-element,
    .shepherd-button,
    .shepherd-modal-overlay-container {
      transition: none;
    }
    
    .shepherd-text > * {
      animation: none;
    }
  }
`;

// ==========================================
// MAIN COMPONENT
// ==========================================

const OnboardingTour: React.FC<OnboardingTourProps> = ({ 
  run, 
  onComplete, 
  theme = 'auto',
  language = 'es' 
}) => {
  const tourRef = useRef<Tour | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const currentTheme = useTheme(theme);

  // Memoized step creation function
  const createTourStep = useCallback((step: TourStep, index: number, total: number) => {
    const isLast = index === total - 1;
    const isFirst = index === 0;

    return {
      title: step.title,
      text: `
        <div class="tour-badge">${step.badge}</div>
        <div class="tour-content">
          ${step.content}
        </div>
      `,
      attachTo: {
        element: step.target,
        on: step.position
      },
      buttons: [
        ...(!isFirst ? [{
          text: 'Anterior',
          action: () => {
            // @ts-ignore
            tourRef.current?.back();
          },
          classes: 'btn-secondary'
        }] : []),
        {
          text: isLast ? '¡Finalizar!' : 'Siguiente',
          action: () => {
            // @ts-ignore
            if (isLast) {
              tourRef.current?.complete();
            } else {
              tourRef.current?.next();
            }
          },
          classes: 'btn-primary'
        }
      ],
      when: {
        show: function(this: Step) {
          // Update progress
          const progressBar = document.querySelector('.tour-progress-fill') as HTMLElement;
          if (progressBar) {
            const progress = ((index + 1) / total) * 100;
            progressBar.style.width = `${progress}%`;
          }
        }
      }
    };
  }, []);

  // Main tour setup effect
  useEffect(() => {
    if (!run) return;

    // Create and inject styles
    const style = document.createElement('style');
    style.textContent = createTourStyles(currentTheme);
    document.head.appendChild(style);
    styleRef.current = style;

    // Create tour instance
    const tour = new Shepherd.Tour(TOUR_CONFIG);
    const steps = TOUR_STEPS[language] || TOUR_STEPS.es;

    // Add all steps
    steps.forEach((step, index) => {
      tour.addStep(createTourStep(step, index, steps.length));
    });

    // Add progress indicator to footer
    tour.on('show', () => {
      const footer = document.querySelector('.shepherd-footer');
      if (footer && !footer.querySelector('.tour-progress')) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'tour-progress';
        progressContainer.innerHTML = `
          <span>Progreso:</span>
          <div class="tour-progress-bar">
            <div class="tour-progress-fill"></div>
          </div>
        `;
        footer.insertBefore(progressContainer, footer.querySelector('.tour-button-group'));
      }
    });

    // Event handlers
    tour.on('complete', onComplete);
    tour.on('cancel', onComplete);

    // Store reference and start
    tourRef.current = tour;
    tour.start();

    // Cleanup function
    return () => {
      if (styleRef.current && document.head.contains(styleRef.current)) {
        document.head.removeChild(styleRef.current);
      }
    };
  }, [run, onComplete, currentTheme, language, createTourStep]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (tourRef.current) {
        tourRef.current.cancel();
      }
    };
  }, []);

  return null;
};

export default OnboardingTour;