
# **App Name**: Lead Lookout

Resumen Ejecutivo
Este proyecto, llamado Mar-IA, es un Sistema de Gestión de Relaciones con Clientes (CRM) avanzado y potenciado por Inteligencia Artificial. Está diseñado para equipos de ventas y negocios, con un enfoque particular en empresas que utilizan soluciones de Punto de Venta (TPV), como HIOPOS.
El sistema va más allá de un CRM tradicional, integrando funcionalidades de generación de leads, comunicación multicanal (WhatsApp), y un asistente de IA (Mar-IA) que automatiza y enriquece tareas clave del ciclo de ventas, desde la personalización del primer contacto hasta la generación de cotizaciones complejas.
La arquitectura es moderna, basada en Next.js (App Router), TypeScript, y Google Genkit para la IA, con Firebase como backend. El proyecto demuestra una alta madurez técnica, con una excelente documentación interna y una arquitectura bien estructurada y pensada para la escalabilidad y el trabajo en equipo (multi-tenant).
Propósito Principal del Proyecto
El objetivo de Mar-IA es centralizar y optimizar el proceso de ventas mediante la automatización inteligente. Sus funciones principales son:
Capturar y Centralizar Leads: Unificar leads de diversas fuentes (Meta Ads, Google Places, importaciones manuales) en una única plataforma.
Gestionar el Flujo de Ventas: Proporcionar herramientas visuales (como tableros Kanban) para seguir el progreso de cada lead a través de las diferentes etapas del pipeline de ventas.
Asistir con IA: Ofrecer un asistente de IA para realizar tareas como generar mensajes personalizados, evaluar el potencial de un negocio, recomendar productos y redactar correos técnicos.
Facilitar la Comunicación: Integrar canales de comunicación directa como WhatsApp para interactuar con los leads desde el propio CRM.
Generar Cotizaciones Profesionales: Crear y enviar cotizaciones detalladas y personalizadas integrándose con servicios como PandaDoc.
Características Clave
El proyecto está repleto de funcionalidades bien definidas:
1. Gestión de Leads y Datos
Fuentes de Datos Múltiples: Capacidad para importar leads desde Meta Ads, Google Places (a través de "Business Finder"), y archivos CSV/XML.
Modelo de Datos Unificado: Un esfuerzo central del proyecto es estandarizar datos de diferentes orígenes en un modelo UnifiedLead. Esto resuelve inconsistencias y simplifica el desarrollo, como se detalla en docs/data-standardization-plan.md.
Visualización Avanzada: Vistas de Kanban (KanbanView, SmartKanbanView) y tablas para gestionar leads, con filtros y búsquedas avanzadas.
Flujos de Venta (Pipelines): Los leads se mueven a través de etapas predefinidas (Nuevo, Contactado, Calificado, Propuesta Enviada, etc.).
2. Inteligencia Artificial (Mar-IA)
Framework de IA: Utiliza Google Genkit con modelos Gemini para orquestar los flujos de IA (src/ai/).
Acciones de IA sobre Leads:
Mensaje de Bienvenida: Genera un primer contacto personalizado.
Evaluar Negocio: Analiza las fortalezas y oportunidades de un lead.
Recomendar Productos: Sugiere productos del catálogo del usuario basándose en el perfil del lead.
Generar Cotización Inteligente: Crea cotizaciones con múltiples paquetes (Básico, Recomendado, Premium).
Email de Configuración: Redacta correos técnicos para soluciones TPV.
Prompts Configurables: Una de las características más potentes. El sistema incluye una interfaz (/ai-prompts) para que los usuarios editen y personalicen los prompts que usa la IA, permitiendo un control total sobre el tono y contenido de las respuestas.
3. Comunicación y Colaboración
Integración con WhatsApp: Una implementación muy completa y profesional que utiliza Evolution API. Permite gestionar instancias, tener conversaciones, enviar mensajes multimedia y cuenta con un sistema anti-spam (cooldown) y de horarios comerciales. El análisis en docs/WHATSAPP_INTEGRATION_ANALYSIS.md es exhaustivo.
Sistema de Invitaciones: Permite a los dueños de organizaciones invitar a nuevos miembros a través de enlaces únicos y seguros, sin necesidad de configurar un servidor de correo.
4. Cotizaciones y Facturación
Generador de Cotizaciones: Módulo que genera cotizaciones profesionales.
Integración con PandaDoc: Utiliza la API de PandaDoc para crear documentos de cotización formales y enviarlos.
Catálogo de Productos: Cada organización puede gestionar su propio catálogo de productos, que es utilizado por la IA para generar recomendaciones y cotizaciones.
Análisis de la Arquitectura y Pila Tecnológica
Frontend: Next.js 15 (con App Router), React 18, TypeScript. La interfaz de usuario está construida con shadcn/ui y Tailwind CSS, lo que garantiza un diseño moderno y consistente.
Backend: Las API Routes de Next.js sirven como el backend, gestionando la lógica de negocio y la comunicación con la base de datos y servicios externos.
Base de Datos: Firebase Firestore para el almacenamiento de datos y Firebase Authentication para la gestión de usuarios. Las reglas de seguridad (firestore.rules) están bien definidas para un entorno multi-tenant (múltiples organizaciones).
IA: Google Genkit y los modelos Gemini de Google. El uso de Zod para validar los esquemas de entrada y salida de las funciones de IA es una excelente práctica.
Servicios Externos:
Evolution API: Para la integración con WhatsApp.
PandaDoc API: Para la generación de documentos de cotización.
Google Places API: Para la búsqueda de negocios.
Cloudinary: Para el almacenamiento de imágenes (mencionado en readme.md).
Despliegue: La documentación (AWS-DEPLOYMENT.md) detalla cómo desplegar en AWS Amplify y AWS ECS con Fargate, mostrando que el proyecto está pensado para producción. La configuración output: 'standalone' en next.config.ts es ideal para contenedores Docker.

## Core Features:

- User Sign-In: Allow users to sign in using email and password through Firebase authentication.
- User Registration: Allow users to register using email and password through Firebase authentication.
- Search Form: Provide a form for users to enter search criteria such as country, place, type of business, and keywords.
- Business Search: Use Google Places API to fetch business listings based on search criteria entered by the user.
- Display and Selection of Leads: Display a list of business listings allowing users to select the ones they want to save as leads.

## Style Guidelines:

- Primary color: A calm blue (#5DADE2) evoking trust and reliability, important for business applications.
- Background color: Light, desaturated blue (#EBF4FA) to provide a clean and unobtrusive backdrop.
- Accent color: A gentle violet (#A381D3) to highlight interactive elements without overwhelming the user.
- Clean and modern fonts for form labels, buttons, and data displays.
- Simple, professional icons to represent actions like searching, saving, and account management.
- Clean and intuitive form layout for entering and displaying information clearly.