
### **Blueprint v2.0 para Claude: Implementación del Generador de Links de Tracking QR (Versión Refinada)**

**Hola Claude,**

Tu feedback sobre el blueprint inicial ha sido increíblemente valioso. Hemos incorporado todas tus sugerencias para crear un plan de implementación refinado que es más seguro, escalable y se integra mejor con nuestra arquitectura actual.

**Nuestra misión ahora es ejecutar este blueprint v2.0.**

---

### **Fase 1: Arquitectura de Datos y APIs Seguras (Back-end)**

#### **1. Estructura de Datos Optimizada (Basada en tu recomendación):**

*   **Acción:** Implementa la siguiente estructura de colecciones en Firestore. Usaremos **subcolecciones**, ya que es más simple para iniciar y podemos migrar si el volumen lo requiere.
    *   **Colección Principal: `trackingLinks`**
        *   `id`, `organizationId`, `name`, `description`, `publicUrlId`, `scanCount`, `submissionCount`, `isActive`, `createdAt`
    *   **Subcolección: `trackingLinks/{linkId}/publicLeads`**
        *   `id`, `leadData` (`name`, `email`, `phone`, `notes`), `status` (`pending_promotion`), `createdAt`, `ipAddress`, `userAgent`

#### **2. API de Gestión de Links (Protegida):**

*   **Archivo:** `src/app/api/tracking-links/route.ts`
*   **Acción:** Implementa los endpoints `GET`, `POST`, `PUT` como se describió originalmente.
*   **Mejora de Seguridad:** En el `POST`, al generar el `publicUrlId`, asegúrate de que sea criptográficamente seguro y corto (ej. usando `nanoid`). Comprueba que sea único en la colección.

#### **3. API Pública de Registro (Reforzada):**

*   **Archivo:** `src/app/api/public/register-lead/route.ts`
*   **Acción:** Implementa el endpoint `POST`.
*   **Mejoras de Seguridad (Crítico):**
    *   **Rate Limiting:** Implementa un sistema de rate limiting básico (ej. usando un middleware o un paquete como `express-rate-limit` si estás en un entorno Node.js compatible). Limita a, por ejemplo, 5 envíos por IP por hora.
    *   **Honeypot:** Añade un campo oculto en el formulario del frontend. Si este campo llega con algún valor a la API, es un bot. Rechaza la petición silenciosamente.
    *   **Validación de Payload:** Usa `zod` para validar estrictamente los datos de entrada. Cualquier campo inesperado debe causar un rechazo.

#### **4. API de Tracking de Escaneos (Optimizada):**

*   **Archivo:** `src/app/api/public/track-scan/route.ts`
*   **Acción:** Implementa el endpoint `POST` para incrementar el `scanCount`.
*   **Mejora de Escalabilidad:** Dentro de esta API, en lugar de usar `FieldValue.increment()` directamente, implementa una lógica que prepare el sistema para un futuro agregador distribuido. Por ahora, puede seguir usando `increment`, pero deja un comentario `// TODO: Migrar a agregador distribuido si el tráfico supera X escrituras/seg.`

---

### **Fase 2: Interfaz de Administración y Landing Page Pública (Front-end)**

#### **1. Interfaz de Gestión (Como en el blueprint original):**

*   **Acción:** Implementa la página `/tracking-links` con la tabla de campañas, contadores y el modal para generar el QR y la URL.
*   **Reutilización:** Como sugeriste, reutiliza componentes del `Dashboard` y `shadcn/ui` para mantener la consistencia visual.

#### **2. Layout Público Aislado (Basado en tu recomendación):**

*   **Acción:** Crea un archivo de layout específico en `src/app/track/layout.tsx`.
*   **Lógica:** Este layout debe ser mínimo. Solo debe incluir los metadatos SEO básicos (`<head>`) y el `<body>` con el `children`. **No debe importar `AppLayoutClient` ni ningún provider de contexto de usuario autenticado.** Esto garantiza el aislamiento completo.

#### **3. Página de Captación Pública:**

*   **Archivo:** `src/app/track/[publicUrlId]/page.tsx`.
*   **Acción:** Implementa la página como se describió, pero con las siguientes mejoras:
    *   **Tracking de Escaneo del Lado del Cliente (Optimización):** En lugar de que el servidor llame a la API de `track-scan`, hazlo desde el cliente con un `useEffect` que se ejecute una sola vez. Esto libera al servidor de esa carga.
        ```typescript
        useEffect(() => {
          // Llama a la API de track-scan en segundo plano
          fetch(`/api/public/track-scan`, { method: 'POST', body: JSON.stringify({ publicUrlId }) });
        }, []); // El array vacío asegura que se ejecute solo una vez
        ```
    *   **Seguridad del Formulario:** Añade el campo "honeypot" oculto con CSS.

---

### **Fase 3: Integración Final con el Flujo de Leads**

Este paso no cambia, pero es crucial.

*   **Acción:** Modifica el **"Hub de Prospección" (`/lead-sources`)**.
*   **Lógica:** Añade la nueva pestaña para "Capturados por QR" que lee de las subcolecciones `.../publicLeads` y permite promocionar los leads al flujo principal de `leads-unified`, cambiando su estado a `promoted`.

---

### **Paso 4: Plan de Validación (Incorporando tus sugerencias)**

Claude, para validar esta implementación refinada:

1.  **Tests de Seguridad:**
    *   Crea un test (puede ser manual con Postman o un test de integración) para la API `/api/public/register-lead` que intente enviar datos maliciosos o campos extra. Debe fallar con un error 400 (Bad Request).
    *   Intenta llamar a la API repetidamente para verificar que el rate limiting funciona.
2.  **Test de Aislamiento de Layout:**
    *   Navega a la URL pública de un tracking link.
    *   Usa las herramientas de desarrollador de React para confirmar que NINGÚN componente o provider del layout de administración (`AppLayoutClient`) está presente en el árbol de componentes.
3.  **Test de Contadores:**
    *   Abre una URL pública y verifica que el `scanCount` aumenta.
    *   Envía el formulario y verifica que el `submissionCount` aumenta.
4.  **Test de Flujo Completo (End-to-End):**
    *   Ejecuta todo el proceso: Crear link -> Escanear QR -> Registrar lead -> Verificar en el Hub de Prospección -> Promocionar al Flujo -> Verificar en el Kanban de `/leads`.

Claude, este blueprint refinado es el resultado de nuestra colaboración. Es más seguro, más escalable y está listo para ser implementado. ¡Adelante