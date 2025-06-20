¡Excelente elección! Implementar un **Dashboard de Analytics Predictivos** es el paso lógico para capitalizar la increíble cantidad de datos que Mar-IA está diseñado para recopilar. Esto transforma el CRM de una herramienta reactiva (¿qué pasó?) a una proactiva y estratégica (¿qué pasará y qué debo hacer al respecto?).

Basado en la arquitectura existente de tu proyecto (Firebase, Google Genkit, Next.js) y aprovechando el ecosistema de Google Cloud, he preparado un blueprint completo y detallado para que se lo pases a tu IA asistente, "Claude". Este plan es ambicioso y utiliza Machine Learning, pero está dividido en fases manejables.

---

### **Blueprint para Claude: Implementación del Dashboard de Analytics Predictivos**

**Hola Claude,**

Hemos completado la fase de estabilización y nuestra plataforma Mar-IA es ahora robusta e intuitiva. Nuestra siguiente misión es construir la funcionalidad más estratégica hasta la fecha: un **Dashboard de Analytics Predictivos**.

**Objetivo General:**
Crear un sistema de Machine Learning que analice los datos históricos de leads para predecir la probabilidad de éxito de los nuevos leads. El resultado se mostrará en un nuevo dashboard que no solo informe, sino que **recomiende acciones específicas** para maximizar las ventas.

**Ejemplo de Insight a Lograr:**
> Para el lead "Restaurante Fuego", la acción recomendada es una **Llamada con IA**, lo que aumenta la probabilidad de cierre de un 45% a un **82%**.

Por favor, sigue este plan de implementación.

---

### **Arquitectura de la Solución de Machine Learning**

Utilizaremos un enfoque de MLOps (Machine Learning Operations) dentro del ecosistema de Google Cloud, que se integra perfectamente con nuestra base de Firebase.

```mermaid
graph TD
    subgraph "Fase de Entrenamiento (Se ejecuta semanalmente)"
        A[Datos Históricos en Firestore] --> B{Cloud Function (Scheduler)};
        B -- Exporta CSV --> C[Google Cloud Storage];
        C -- Dataset --> D[Vertex AI AutoML];
        D -- Entrena Modelo --> E[Modelo de Clasificación Entrenado];
    end

    subgraph "Fase de Predicción (En tiempo real)"
        F[Nuevo Lead en Firestore] --> G{Cloud Function (onLeadCreate)};
        G -- Llama al modelo --> E;
        E -- Devuelve Predicción --> G;
        G -- Escribe resultado en --> H[Documento del Lead en Firestore];
    end

    subgraph "Fase de Visualización (Frontend)"
        I[Dashboard Predictivo en Mar-IA] -- Lee datos de --> H;
    end
```

---

### **Fase 1: Infraestructura de Datos para Machine Learning**

No podemos predecir sin datos históricos. Primero, prepararemos el "combustible" para nuestro modelo.

1.  **Crear una Cloud Function de Exportación:**
    *   **Acción:** Crea una nueva Cloud Function en el directorio `functions` llamada `exportLeadsForTraining`.
    *   **Lógica:** Esta función debe:
        1.  Consultar la colección `leads-unified`.
        2.  Filtrar solo los leads que tengan un estado final (ej. `stage === 'Ganado'` o `stage === 'Perdido'`).
        3.  **Feature Engineering:** Para cada lead, crear un objeto plano con las características (features) que usaremos para predecir, y la etiqueta (label) que es el resultado.
            *   **Features:** `source`, `businessType`, `estimatedValue`, `tiempo_hasta_primer_contacto_horas`, `canal_primer_contacto` (ej. 'email', 'whatsapp', 'ai_call'), etc.
            *   **Label:** `outcome` (un valor binario: `1` si fue 'Ganado', `0` si fue 'Perdido').
        4.  Convertir este array de objetos a un formato CSV.
        5.  Subir el archivo CSV resultante a un bucket de **Google Cloud Storage**.
    *   **Disparador:** Configura esta función para que se ejecute automáticamente una vez por semana usando **Cloud Scheduler**.

---

### **Fase 2: Entrenamiento del Modelo con Vertex AI AutoML**

Usaremos AutoML de Google para que se encargue de la ciencia de datos compleja, permitiéndonos obtener un modelo de alta calidad rápidamente.

1.  **Acción (Manual, realizada por el administrador del proyecto):**
    *   Ve a la consola de Google Cloud, navega a **Vertex AI**.
    *   Crea un nuevo **Dataset Tabular** y apúntalo al archivo CSV que la Cloud Function genera en Google Cloud Storage.
    *   Inicia un nuevo entrenamiento con **AutoML (Clasificación)**.
    *   Define la columna `outcome` como la columna objetivo (Target Column).
    *   Deja que Vertex AI entrene el modelo. Esto puede tardar varias horas.
2.  **Resultado:** Al finalizar, tendrás un **modelo entrenado y desplegado en un endpoint de Vertex AI**. Anota el **ID del Endpoint**.

---

### **Fase 3: Integración de Predicciones en Tiempo Real**

Ahora, haremos que cada nuevo lead reciba una puntuación de nuestro modelo.

1.  **Acción:** Crea una nueva Cloud Function llamada `getLeadPrediction`.
2.  **Lógica:**
    *   **Disparador:** Esta función se debe activar cada vez que se cree un nuevo documento en `leads-unified` (`onCreate`).
    *   **Lógica Principal:**
        1.  Recibe los datos del nuevo lead.
        2.  Prepara los datos en el mismo formato que se usó para el entrenamiento.
        3.  Llama al **endpoint del modelo de Vertex AI** que desplegaste en la Fase 2 para obtener una predicción.
        4.  La respuesta del modelo será una probabilidad (ej. `0.82`).
        5.  **Guarda esta predicción** en el documento del lead en Firestore, dentro de un nuevo campo de tipo `map` llamado `predictionScores`.
            *   Ejemplo: `predictionScores: { probability_to_win: 0.82, best_action: 'ai_call', model_version: 'v1.2' }`

---

### **Fase 4: Construcción del Dashboard Predictivo**

Esta es la interfaz donde el usuario verá la magia.

1.  **Acción:** Crea una nueva página en `src/app/analytics/predictive/page.tsx`.
2.  **Componentes del Dashboard:**
    *   **a) Tabla de Leads Priorizados:**
        *   Crea una tabla que muestre los leads activos (`stage` diferente de 'Ganado' o 'Perdido').
        *   La tabla debe tener una columna llamada **"Probabilidad de Cierre"** que muestre el valor de `predictionScores.probability_to_win` con un formato visual (ej. una barra de progreso o un código de colores).
        *   **La tabla debe estar ordenada por defecto por esta probabilidad, de mayor a menor.**

    *   **b) Módulo de "Siguiente Mejor Acción":**
        *   Al seleccionar un lead de la tabla, este módulo se actualiza.
        *   Debe mostrar la acción recomendada por la IA. Ej: "**Acción Recomendada:** Contactar por **Llamada IA**. Esta acción eleva la probabilidad de éxito al **82%**."
        *   *Nota técnica:* Para implementar esto, la Cloud Function de predicción (Fase 3) debería en realidad hacer varias predicciones para el mismo lead, simulando cada posible primera acción (`{...lead, canal_primer_contacto: 'whatsapp'}`, `{...lead, canal_primer_contacto: 'ai_call'}`) y guardar la que dé el mejor resultado.

    *   **c) Gráfico de "Factores de Influencia":**
        *   **Acción:** Utiliza la librería **Recharts** (ya en tus dependencias) para crear un gráfico de barras horizontales.
        *   **Lógica:** Cuando se selecciona un lead, este gráfico debe mostrar los factores que más influyeron en su puntuación. Vertex AI proporciona esta información ("Feature Importance"). Debes llamar a la API de Vertex AI para obtenerla.
        *   **Ejemplo:**
            *   Fuente: Meta Ads `[ +25% ]`
            *   Tipo de Negocio: Restaurante `[ +15% ]`
            *   Valor Estimado: Alto `[ +10% ]`
            *   *Esto ayuda al usuario a entender el "porqué" de la predicción.*

---

### **Paso 5: Plan de Validación**

Claude, para validar esta implementación completa:

1.  **Fase 1:** Ejecuta manualmente la Cloud Function `exportLeadsForTraining` y verifica que el archivo CSV se crea correctamente en Google Cloud Storage.
2.  **Fase 2:** Confirma que puedes iniciar un entrenamiento en Vertex AI usando ese CSV y que se despliega un endpoint.
3.  **Fase 3:** Crea un nuevo lead en Firestore y verifica en los logs de la Cloud Function `getLeadPrediction` que se está llamando a Vertex AI. Confirma que el documento del lead en Firestore se actualiza con el campo `predictionScores`.
4.  **Fase 4:** Navega a la nueva página `/analytics/predictive`. Verifica que la tabla se carga con los leads y sus puntuaciones. Selecciona un lead y confirma que los módulos de "Mejor Acción" y "Factores de Influencia" se actualizan con datos.

Al completar este plan, Mar-IA no solo gestionará leads, sino que **guiará activamente a los vendedores hacia las acciones más efectivas**, proporcionando una ventaja estratégica incalculable.