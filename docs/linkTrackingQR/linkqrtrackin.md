Implementación del Generador de Links de Tracking QR para Captación de Leads**

**Hola Claude,**

Nuestra próxima gran funcionalidad es construir un sistema de captación de leads a través de códigos QR. Permitiremos a nuestros usuarios crear "campañas de tracking" que generan una URL pública única. Esta URL llevará a un formulario de registro. Debemos poder medir el rendimiento de cada campaña (escaneos vs. registros).

El sistema debe ser **seguro, escalable y completamente separado** de la interfaz de administración del CRM.

Por favor, sigue este plan de implementación por fases.

---

### **Fase 1: Arquitectura de Datos y APIs**

Primero, sentaremos las bases en el backend para almacenar y gestionar estas campañas.

1.  **Nuevas Colecciones en Firestore:**
    *   **`trackingLinks` (Colección Principal):**
        *   `id`: (autogenerado)
        *   `organizationId`: A qué organización pertenece.
        *   `name`: Nombre de la campaña (ej. "Flyers Conferencia Tech 2025").
        *   `description`: Descripción interna.
        *   `publicUrlId`: Un ID único y corto que formará la URL pública (ej. `techconf25`).
        *   `scanCount`: Contador de visitas.
        *   `submissionCount`: Contador de registros completados.
        *   `isActive`: (booleano)
        *   `createdAt`: (timestamp)
    *   **`publicLeads` (Colección para Leads Públicos):**
        *   `id`: (autogenerado)
        *   `trackingLinkId`: El ID del link que lo generó.
        *   `leadData`: { `name`, `email`, `phone`, `notes` }
        *   `status`: 'pending_promotion' (estado inicial)
        *   `createdAt`: (timestamp)

2.  **API para la Gestión de Tracking Links (para el admin):**
    *   **Acción:** Crea una nueva ruta de API en `src/app/api/tracking-links/route.ts`.
    *   **Lógica (`GET`, `POST`, `PUT`):**
        *   `POST`: Crea un nuevo documento en `trackingLinks`. Debe generar un `publicUrlId` corto y único.
        *   `GET`: Obtiene todos los `trackingLinks` de una `organizationId`.
        *   `PUT`: Permite actualizar un link (ej. desactivarlo).

3.  **API Pública para el Formulario de Registro:**
    *   **Acción:** Crea una nueva ruta de API en `src/app/api/public/register-lead/route.ts`.
    *   **Lógica (`POST`):**
        *   **¡SIN AUTENTICACIÓN!** Este endpoint debe ser público.
        *   Recibirá los datos del formulario (`name`, `email`, etc.) y el `publicUrlId` de la campaña.
        *   **Paso 1: Validar.** Busca en `trackingLinks` si existe un link activo con ese `publicUrlId`. Si no, devuelve un error 404.
        *   **Paso 2: Guardar el Lead.** Crea un nuevo documento en la colección `publicLeads` con los datos recibidos.
        *   **Paso 3: Actualizar Contadores.** Usando una transacción de Firestore, incrementa el `submissionCount` del `trackingLink` correspondiente.

---

### **Fase 2: Interfaz de Administración de Tracking Links**

Ahora, daremos a nuestros usuarios una forma de crear y gestionar estas campañas.

1.  **Acción:** Reutiliza la página `src/app/tracking-links/page.tsx` que ya existe en la navegación de "COMUNICACIÓN".
2.  **Lógica de la Página:**
    *   **Vista Principal:** Una tabla que muestra todas las campañas de `trackingLinks` creadas por la organización.
    *   **Columnas:** Nombre de la Campaña, Visitas (`scanCount`), Registros (`submissionCount`), Tasa de Conversión (`submissionCount / scanCount`), y un botón de "Acciones".
    *   **Botón "Crear Nuevo Link":** Abre un modal (`<Dialog>`) que permite al usuario introducir un `name` y `description` para una nueva campaña. Al guardar, llama a la API `POST /api/tracking-links`.
3.  **Modal de Detalles y QR:**
    *   Desde el menú de "Acciones" de la tabla, una opción "Ver Detalles y QR" abrirá otro modal.
    *   Este modal mostrará:
        *   La URL pública completa (ej. `https://tu-crm.com/track/techconf25`).
        *   Un **código QR** generado a partir de esa URL. Usa la librería `react-qr-code` para esto: `npm install react-qr-code`.
        *   Botones para "Copiar URL" y "Descargar QR".

---

### **Fase 3: La Página de Captación Pública**

Esta es la página que verán los leads al escanear el QR. Debe ser simple, rápida y segura.

1.  **Acción:** Crea una nueva **ruta pública dinámica** en `src/app/track/[publicUrlId]/page.tsx`.
    *   Esta página debe tener un layout **completamente diferente** al de la aplicación principal. No debe mostrar la sidebar ni ninguna otra parte del CRM.
2.  **Lógica de la Página (`page.tsx`):**
    *   **Paso 1: Incrementar Scan Count.** La primera vez que esta página se carga en el servidor, debe llamar a una nueva API `POST /api/public/track-scan` que simplemente incremente el `scanCount` del `trackingLink` correspondiente. Esto nos permite diferenciar visitas de registros.
    *   **Paso 2: El Formulario.** Muestra un formulario simple y amigable.
        *   Título: Puedes obtener el `name` del `trackingLink` para personalizarlo (ej. "Regístrate para la Conferencia Tech 2025").
        *   Campos: Nombre, Email, Teléfono, Comentarios.
    *   **Paso 3: Envío del Formulario.** Al enviar, el formulario llamará a la API pública `POST /api/public/register-lead` que creaste en la Fase 1.
    *   **Paso 4: Mensaje de Éxito.** Tras un envío exitoso, oculta el formulario y muestra un mensaje de agradecimiento amigable (ej. "¡Gracias por registrarte! Nos pondremos en contacto contigo pronto.").

### **Paso 4: Integración con el Flujo de Leads Existente**

Los leads capturados públicamente necesitan entrar en el flujo de ventas.

1.  **Acción:** Modifica el **"Hub de Prospección" (`/lead-sources`)**.
2.  **Lógica a Implementar:**
    *   Añade una nueva pestaña (`<TabsTrigger>`) llamada **"Capturados por QR"** o **"Leads Públicos"**.
    *   Esta pestaña mostrará los leads de la colección `publicLeads` que tengan el estado `status: 'pending_promotion'`.
    *   Reutiliza el botón **"Promocionar al Flujo"**. Al hacer clic:
        1.  Llama a la API `/api/leads/promote` (que ya existe).
        2.  La API tomará los datos de `publicLeads`, los convertirá al formato `UnifiedLead` y los moverá a `leads-unified`.
        3.  Finalmente, cambiará el estado en `publicLeads` a `status: 'promoted'` para que desaparezca de esta vista.

---

### **Paso 5: Plan de Validación**

Claude, para validar esta completa funcionalidad de extremo a extremo:

1.  **Crear Campaña:** Ve a `/tracking-links`, crea una nueva campaña y verifica que aparece en la tabla.
2.  **Obtener QR:** Abre los detalles de la campaña, copia la URL pública y verifica que el código QR se genera correctamente.
3.  **Simular Escaneo:** Abre la URL pública en una ventana de incógnito.
    *   **Verificación 1 (Contador de Visitas):** Vuelve al dashboard de `/tracking-links` en tu sesión de admin y recarga. El contador de "Visitas" para esa campaña debe haber aumentado en 1.
4.  **Simular Registro de Lead:** Rellena y envía el formulario público.
    *   **Verificación 2:** Debes ver el mensaje de "Gracias".
    *   **Verificación 3 (Contador de Registros):** Vuelve al dashboard de `/tracking-links` y recarga. El contador de "Registros" debe haber aumentado en 1.
5.  **Verificar en Hub de Prospección:** Ve a `/lead-sources` y abre la nueva pestaña "Capturados por QR". El lead que acabas de registrar debe aparecer ahí.
6.  **Validar Promoción:** Promociona ese lead al flujo principal y confirma que aparece en el Kanban de `/leads` y desaparece del Hub de Prospección.

Con esta implementación, habrás añadido un canal de captación de leads del mundo real al mundo digital, con tracking completo, una experiencia segura y una integración perfecta en los flujos de trabajo que ya hemos construido.