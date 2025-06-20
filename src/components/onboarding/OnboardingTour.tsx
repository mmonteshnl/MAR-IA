"use client";

import React, { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';

interface OnboardingTourProps {
  run: boolean;
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onComplete }) => {
  const tourRef = useRef<Shepherd.Tour | null>(null);

  useEffect(() => {
    if (run) {
      // Create new tour instance
      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          classes: 'shepherd-theme-custom',
          scrollTo: { behavior: 'smooth', block: 'center' },
          modalOverlayOpeningPadding: 10,
          modalOverlayOpeningRadius: 8,
        }
      });

      // Define tour steps
      tour.addStep({
        title: '¡Bienvenido a Mar-IA! 🎉',
        text: `
          <div class="space-y-3">
            <p class="text-sm">Tu plataforma integral de gestión de leads</p>
            <p class="text-sm">Este es tu <strong>Dashboard</strong>, donde tienes una vista rápida de tu actividad y acceso directo a las funciones más importantes.</p>
          </div>
        `,
        attachTo: {
          element: 'main',
          on: 'center'
        },
        buttons: [
          {
            text: 'Siguiente',
            action: tour.next,
            classes: 'btn btn-primary'
          }
        ]
      });

      tour.addStep({
        title: 'Sección LEADS 🎯',
        text: `
          <div class="space-y-3">
            <p class="text-sm text-muted-foreground">El centro de tu prospección</p>
            <p class="text-sm"><strong>Aquí empieza todo.</strong> La sección LEADS centraliza la captación y gestión de tus prospectos desde múltiples fuentes.</p>
          </div>
        `,
        attachTo: {
          element: '[data-onboarding="leads-section"]',
          on: 'right'
        },
        buttons: [
          {
            text: 'Anterior',
            action: tour.back,
            classes: 'btn btn-secondary'
          },
          {
            text: 'Siguiente',
            action: tour.next,
            classes: 'btn btn-primary'
          }
        ]
      });

      tour.addStep({
        title: 'Hub de Prospección 📊',
        text: `
          <div class="space-y-3">
            <p class="text-sm text-muted-foreground">Importa y gestiona fuentes</p>
            <p class="text-sm">En el <strong>"Hub de Prospección"</strong>, puedes importar leads desde archivos CSV, buscar nuevos negocios en Google Places, y gestionar leads de Meta Ads. Una vez calificados, <strong>promociónalos a tu flujo de ventas</strong>.</p>
          </div>
        `,
        attachTo: {
          element: '[data-onboarding="hub-prospeccion"]',
          on: 'right'
        },
        buttons: [
          {
            text: 'Anterior',
            action: tour.back,
            classes: 'btn btn-secondary'
          },
          {
            text: 'Siguiente',
            action: tour.next,
            classes: 'btn btn-primary'
          }
        ]
      });

      tour.addStep({
        title: 'Flujo de Leads 🔄',
        text: `
          <div class="space-y-3">
            <p class="text-sm text-muted-foreground">Tu pipeline de ventas</p>
            <p class="text-sm">En <strong>"Flujo de Leads"</strong>, gestionas tu pipeline de ventas principal. Aquí puedes mover leads entre diferentes etapas, hacer seguimiento del progreso y cerrar ventas.</p>
          </div>
        `,
        attachTo: {
          element: '[data-onboarding="flujo-leads"]',
          on: 'right'
        },
        buttons: [
          {
            text: 'Anterior',
            action: tour.back,
            classes: 'btn btn-secondary'
          },
          {
            text: 'Siguiente',
            action: tour.next,
            classes: 'btn btn-primary'
          }
        ]
      });

      tour.addStep({
        title: 'Sección VENTAS 💰',
        text: `
          <div class="space-y-3">
            <p class="text-sm text-muted-foreground">Cotizaciones inteligentes</p>
            <p class="text-sm">Cuando un lead esté listo para comprar, ven a la <strong>sección VENTAS</strong> para generar cotizaciones profesionales con IA o integrar con PandaDoc para documentos más complejos.</p>
          </div>
        `,
        attachTo: {
          element: '[data-onboarding="ventas-section"]',
          on: 'right'
        },
        buttons: [
          {
            text: 'Anterior',
            action: tour.back,
            classes: 'btn btn-secondary'
          },
          {
            text: 'Siguiente',
            action: tour.next,
            classes: 'btn btn-primary'
          }
        ]
      });

      tour.addStep({
        title: 'AUTOMATIZACIÓN ⚡',
        text: `
          <div class="space-y-3">
            <p class="text-sm text-muted-foreground">La funcionalidad más potente</p>
            <p class="text-sm"><strong>Esta es la joya de la corona:</strong> crea flujos de trabajo visuales con CONEX para automatizar cualquier tarea. Desde seguimiento de leads hasta integración con herramientas externas.</p>
          </div>
        `,
        attachTo: {
          element: '[data-onboarding="automatización-section"]',
          on: 'right'
        },
        buttons: [
          {
            text: 'Anterior',
            action: tour.back,
            classes: 'btn btn-secondary'
          },
          {
            text: 'Siguiente',
            action: tour.next,
            classes: 'btn btn-primary'
          }
        ]
      });

      tour.addStep({
        title: '¡Listo para empezar! 🚀',
        text: `
          <div class="space-y-3">
            <p class="text-sm text-muted-foreground">Ya conoces lo básico</p>
            <p class="text-sm">¡Perfecto! Ya conoces las funciones principales de Mar-IA. Explora la <strong>sección de CONFIGURACIÓN</strong> para personalizar la plataforma según tus necesidades específicas.</p>
          </div>
        `,
        attachTo: {
          element: '[data-onboarding="configuración-section"]',
          on: 'right'
        },
        buttons: [
          {
            text: 'Anterior',
            action: tour.back,
            classes: 'btn btn-secondary'
          },
          {
            text: '¡Finalizar!',
            action: () => {
              tour.complete();
              onComplete();
            },
            classes: 'btn btn-primary'
          }
        ]
      });

      // Handle tour completion
      tour.on('complete', () => {
        onComplete();
      });

      // Handle tour cancel
      tour.on('cancel', () => {
        onComplete();
      });

      tourRef.current = tour;
      tour.start();

      // Add custom CSS
      const style = document.createElement('style');
      style.textContent = `
        .shepherd-modal-overlay-container {
          z-index: 1000;
        }
        .shepherd-element {
          z-index: 1001;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          font-family: inherit;
          max-width: 400px;
        }
        .shepherd-content {
          padding: 20px;
        }
        .shepherd-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
          color: hsl(var(--foreground));
        }
        .shepherd-text {
          line-height: 1.5;
          margin-bottom: 16px;
        }
        .shepherd-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 16px;
          border-top: 1px solid hsl(var(--border));
        }
        .shepherd-button {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .btn-primary {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .btn-primary:hover {
          background: hsl(var(--primary)) / 0.9;
        }
        .btn-secondary {
          background: transparent;
          color: hsl(var(--muted-foreground));
          border: 1px solid hsl(var(--border));
          margin-right: 8px;
        }
        .btn-secondary:hover {
          background: hsl(var(--muted)) / 0.5;
        }
        .shepherd-cancel-icon {
          background: transparent;
          border: none;
          color: hsl(var(--muted-foreground));
          cursor: pointer;
          font-size: 20px;
          position: absolute;
          right: 8px;
          top: 8px;
          padding: 4px;
        }
        .shepherd-cancel-icon:hover {
          color: hsl(var(--foreground));
        }
        .space-y-3 > * + * {
          margin-top: 12px;
        }
        .text-muted-foreground {
          color: hsl(var(--muted-foreground));
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }

    return () => {
      if (tourRef.current) {
        tourRef.current.cancel();
        tourRef.current = null;
      }
    };
  }, [run, onComplete]);

  // Cleanup on unmount
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