Aquí tienes la lista de las acciones sugeridas con IA en la aplicación, separadas en las que ya están implementadas y las que están marcadas como "Próximamente", junto con una explicación del objetivo de cada una y el objetivo general de todas:

Objetivo general de las acciones con IA:
Estas acciones están diseñadas para asistir en la gestión y seguimiento de leads, facilitando la comunicación, evaluación y recomendación de productos o estrategias de venta mediante inteligencia artificial, con el fin de mejorar la eficiencia y efectividad del proceso comercial.

Acciones implementadas (ya funcionales):

1. Mensaje de Bienvenida (Clave: "welcome")
   - Objetivo: Generar un mensaje de bienvenida personalizado para el lead, basado en su nombre y tipo de negocio, para iniciar el contacto de manera efectiva.

2. Evaluar Negocio (Clave: "evaluate")
   - Objetivo: Evaluar características del negocio del lead, considerando nombre, tipo de negocio, dirección y sitio web, para obtener una evaluación que ayude en la toma de decisiones.

3. Recomendar Productos (Clave: "recommend")
   - Objetivo: Generar recomendaciones de productos o servicios personalizados para el lead, basados en el catálogo de productos del usuario y la evaluación del negocio.

Acciones "Próximamente" (pendientes de implementación):

1. Estrategias de Contacto (Clave: "contactStrategy")
   - Objetivo: Sugerir estrategias o guiones para el primer contacto con el lead.

2. Mejores Momentos para Seguimiento (Clave: "bestFollowUpTimes")
   - Objetivo: Recomendar los mejores momentos para realizar seguimientos con el lead.

3. Seguimiento (Clave: "followUpEmail")
   - Objetivo: Generar plantillas personalizadas de correos de seguimiento para mantener el contacto con el lead.

4. Manejo de Objeciones (Clave: "objectionHandling")
   - Objetivo: Sugerir consejos para manejar objeciones durante el proceso de venta.

5. Resumen Propuesta (Clave: "proposalSummary")
   - Objetivo: Generar un resumen de la propuesta o puntos clave de venta para el lead.

6. Análisis Competidores (Clave: "competitorAnalysis")
   - Objetivo: Sugerir análisis comparativo con competidores para mejorar la estrategia de venta.

7. Recordatorio Seguimiento (Clave: "followUpReminder")
   - Objetivo: Generar mensajes recordatorios para realizar seguimientos oportunos.

8. Tácticas Negociación (Clave: "negotiationTactics")
   - Objetivo: Sugerir tácticas de negociación o concesiones para cerrar ventas.

9. Estrategia Negociación (Clave: "negotiationStrategy")
   - Objetivo: Proporcionar estrategias para la negociación con el lead.

10. Contraoferta (Clave: "counterOffer")
    - Objetivo: Generar mensajes para contraofertas durante la negociación.

11. Evaluación Riesgos (Clave: "riskAssessment")
    - Objetivo: Evaluar riesgos asociados a la negociación o venta.

12. Mensajes de Agradecimiento (Clave: "thankYou")
    - Objetivo: Generar mensajes de agradecimiento para leads ganados.

13. Venta Cruzada (Clave: "crossSell")
    - Objetivo: Sugerir oportunidades de venta cruzada para clientes existentes.

14. Encuesta Cliente (Clave: "customerSurvey")
    - Objetivo: Generar encuestas de satisfacción para clientes.

15. Recuperación (Clave: "winBack")
    - Objetivo: Crear campañas para recuperar leads perdidos.

16. Análisis Pérdidas (Clave: "lossAnalysis")
    - Objetivo: Analizar las causas de pérdidas de leads o ventas.

17. Informe Competidores (Clave: "competitorReport")
    - Objetivo: Generar informes sobre competidores para mejorar la estrategia comercial.

Esta lista refleja las acciones definidas en la función renderActionButtons en el archivo src/app/leads/page.tsx, con sus respectivos estados y objetivos funcionales.


Okay, ¡excelente! Vamos a generar los prompts para las acciones de IA "Próximamente", manteniendo la estructura y el espíritu de los flujos existentes.

Estructura General de los Archivos .ts (Recordatorio):

Cada nueva acción de IA seguirá esta estructura de archivo:

src/ai/flows/generate[ActionName]Flow.ts (o suggest[ActionName]Flow.ts según corresponda).

Definición del InputSchema con Zod (Generate[ActionName]InputSchema).

Definición del OutputSchema con Zod (Generate[ActionName]OutputSchema).

Función async function generate[ActionName](input): Promise<Output>.

Constante prompt = ai.definePrompt(...).

Constante flow = ai.defineFlow(...).

Campos Comunes de Input (Ejemplos para los Schemas):

La mayoría de los inputs necesitarán información básica del lead y del usuario/contexto:

const BaseLeadInfoInputSchema = z.object({
  leadId: z.string().describe('ID único del lead.'), // Útil para logs o referencias internas
  leadName: z.string().describe('El nombre del negocio o contacto principal del lead.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  leadStage: z.string().optional().describe('Etapa actual del lead en el pipeline (ej. Nuevo, Calificado, Negociación).'),
  leadNotes: z.string().optional().describe('Notas generales existentes sobre el lead.'),
  // Para interacciones más avanzadas, podrías necesitar:
  // previousInteractions: z.array(z.object({ date: z.string(), type: z.string(), summary: z.string() })).optional().describe('Historial de interacciones con el lead.'),
  // specificProductsOfInterest: z.array(z.string()).optional().describe('Productos o servicios específicos en los que el lead ha mostrado interés.'),
});

// Para acciones que involucren productos/servicios del usuario
const UserProductCatalogInputSchema = z.object({
  userProducts: z.array(ProductSchema).optional().describe('Lista de productos/servicios que ofrece el usuario (reutilizar ProductSchema de salesRecommendationsFlow).'),
});


A continuación, los prompts para cada acción. Me enfocaré en el contenido del prompt dentro de ai.definePrompt.


1. Estrategias de Contacto (Clave: "contactStrategy")

Nombre del flujo: generateContactStrategyFlow.ts

Input Adicional (ejemplo): contactObjective: z.string().optional().describe('Objetivo específico para este primer contacto, si el usuario lo define.')

Output (ejemplo):

const GenerateContactStrategyOutputSchema = z.object({
  suggestedChannels: z.array(z.object({
    channel: z.string().describe('Canal de contacto sugerido (ej. Email, Llamada, WhatsApp, LinkedIn).'),
    reasoning: z.string().describe('Justificación breve para elegir este canal para este lead.'),
  })).min(1).max(2).describe('Uno o dos canales de contacto sugeridos con su justificación.'),
  keyTalkingPoints: z.array(z.string()).min(2).max(4).describe('Puntos clave (2-4) para mencionar en el primer contacto, enfocados en generar interés y valor.'),
  openingLineSuggestion: z.string().optional().describe('Sugerencia para una frase de apertura, adaptada al canal principal sugerido.'),
  primaryGoalOfContact: z.string().describe('Objetivo principal recomendado para este primer contacto (ej. Presentarse y agendar breve llamada, Compartir un recurso valioso, Entender un desafío clave).')
});
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END

Prompt para la IA:

Eres un estratega de ventas B2B y comunicación altamente experimentado, especializado en el primer contacto con leads. Tu tarea es sugerir la mejor estrategia para el primer contacto con el lead "{{leadName}}".

Información disponible del lead:
- Nombre: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio: {{{businessType}}}{{/if}}
{{#if leadStage}}- Etapa Actual: {{{leadStage}}}{{/if}}
{{#if leadNotes}}- Notas Adicionales del Lead: {{{leadNotes}}}{{/if}}
{{#if contactObjective}}- Objetivo del Usuario para este Contacto: {{{contactObjective}}}{{/if}}

{{#if userProducts.length}}
Productos/Servicios que ofrece el usuario (para contextualizar el valor):
{{#each userProducts}}
- Nombre: {{this.name}}, Descripción: {{this.description}}
{{/each}}
{{/if}}

Basándote en esta información:
1.  **Canales Sugeridos:** Recomienda 1 o 2 canales principales más apropiados para el primer contacto con "{{{leadName}}}" (ej. Email, Llamada Telefónica, Mensaje de LinkedIn, WhatsApp si se tiene el número y es culturalmente aceptable). Justifica brevemente por qué cada canal es adecuado para este lead y su tipo de negocio.
2.  **Puntos Clave de Conversación:** Identifica de 2 a 4 puntos clave que se deberían mencionar para captar el interés del lead. Estos puntos deben conectar las posibles necesidades o desafíos del lead (inferidos de su tipo de negocio o notas) con el valor que los productos/servicios del usuario pueden ofrecer.
3.  **Sugerencia de Frase de Apertura (Opcional):** Para el canal principal sugerido, redacta una frase de apertura cortés, profesional y que invite a la conversación.
4.  **Objetivo Principal del Contacto:** Define claramente cuál debería ser el objetivo primordial de este primer contacto, considerando la información del lead y el objetivo del usuario si fue provisto. Por ejemplo: "Presentarse, establecer credibilidad y agendar una breve llamada de descubrimiento de 15 minutos." o "Compartir un caso de estudio relevante y medir el interés inicial."

Considera la etapa actual del lead. Si es "Nuevo", el enfoque será más introductorio y de creación de valor.
El resultado debe ser práctico y accionable para un profesional de ventas. Evita respuestas genéricas.

Genera la respuesta en el formato JSON especificado.
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Text
IGNORE_WHEN_COPYING_END



-------------------------------
2. Mejores Momentos para Seguimiento (Clave: "bestFollowUpTimes")

Nombre del flujo: suggestBestFollowUpTimesFlow.ts

Input Adicional (ejemplo): lastInteraction: z.object({ date: z.string(), type: z.string(), summary: z.string() }).optional().describe('Información sobre la última interacción.'), leadTimeZone: z.string().optional().describe('Zona horaria del lead (ej. America/New_York, Europe/Madrid).'), countryCode: z.string().optional().describe('Código de país del lead (ej. US, ES, MX) para inferir cultura de negocios.')

Output (ejemplo):

const SuggestBestFollowUpTimesOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      dayOfWeek: z.string().describe('Día de la semana sugerido (ej. Martes, Jueves).'),
      timeSlotLocal: z.string().describe('Franja horaria sugerida en la hora local del lead (ej. 10:00 AM - 11:30 AM, 2:00 PM - 4:00 PM).'),
      reasoning: z.string().describe('Breve justificación de la sugerencia, considerando el tipo de negocio y prácticas comunes.')
    })
  ).min(1).max(3).describe('Lista de 1 a 3 sugerencias de momentos óptimos para el seguimiento.'),
  generalTips: z.array(z.string()).optional().describe('Consejos generales sobre el timing de seguimientos para este tipo de lead o su industria, incluyendo la frecuencia ideal de seguimiento si la última interacción fue reciente.')
});
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END

Prompt para la IA:

Eres un experto en productividad de ventas y análisis del comportamiento del cliente B2B. Tu tarea es recomendar los mejores momentos para realizar un seguimiento efectivo al lead "{{leadName}}".

Información disponible del lead:
- Nombre: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio: {{{businessType}}}{{/if}}
{{#if leadStage}}- Etapa Actual: {{{leadStage}}}{{/if}}
{{#if lastInteraction}}
- Última Interacción:
  - Fecha: {{{lastInteraction.date}}}
  - Tipo: {{{lastInteraction.type}}}
  - Resumen: {{{lastInteraction.summary}}}
{{/if}}
{{#if leadTimeZone}}- Zona Horaria del Lead: {{{leadTimeZone}}}{{/if}}
{{#if countryCode}}- País del Lead: {{{countryCode}}}{{/if}}
{{#if leadNotes}}- Notas Adicionales (pueden incluir preferencias o historial de contacto): {{{leadNotes}}}{{/if}}

Basándote en esta información y en conocimiento general sobre horarios productivos y cultura de negocios (considerando el país si se provee):
1.  **Sugerencias Específicas:** Proporciona de 1 a 3 sugerencias de días de la semana y franjas horarias específicas (en la hora local del lead, si se conoce su zona horaria) para el seguimiento.
2.  **Justificación:** Para cada sugerencia, explica brevemente por qué ese momento podría ser efectivo. Considera factores como: evitar picos de trabajo (lunes AM), momentos de menor distracción, o días donde se toman decisiones.
3.  **Consejos Generales (Opcional):**
    *   Si la última interacción fue reciente, sugiere un plazo o frecuencia de seguimiento apropiada antes de intentar estos "mejores momentos".
    *   Añade 1-2 consejos generales sobre el timing de seguimientos para leads del tipo "{{businessType}}" o de la industria/país si es relevante.

Evita ser demasiado prescriptivo si la información es limitada. Si no se conoce la zona horaria, indica que las sugerencias son en un horario laboral general y que se deben ajustar.
El objetivo es maximizar la probabilidad de una respuesta positiva.

Genera la respuesta en el formato JSON especificado.
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Text
IGNORE_WHEN_COPYING_END


-------------------------------

3. Seguimiento (Email) (Clave: "followUpEmail")

Nombre del flujo: generateFollowUpEmailFlow.ts

Input Adicional (ejemplo): previousContextSummary: z.string().describe('Resumen de la interacción previa o el punto clave que motiva este seguimiento.'), desiredOutcome: z.string().optional().describe('¿Qué espera lograr el usuario con este email de seguimiento (ej. Agendar demo, Obtener respuesta a pregunta X, Compartir recurso Y)?'), senderName: z.string().describe('Nombre del comercial que envía el email.'), senderCompany: z.string().describe('Nombre de la empresa del comercial.')

Output (ejemplo):

const GenerateFollowUpEmailOutputSchema = z.object({
  subject: z.string().describe('Asunto conciso, personalizado y atractivo para el correo de seguimiento.'),
  body: z.string().describe('Cuerpo completo del correo de seguimiento en texto plano, listo para ser adaptado y enviado. Debe incluir saludo, referencia al contexto, valor, CTA y firma.'),
  customizationPoints: z.array(z.string()).optional().describe('Lista de 2-3 sugerencias específicas sobre cómo el comercial podría personalizar aún más el email antes de enviarlo (ej. "Menciona un logro reciente de su empresa si lo conoces", "Adapta la CTA si tienes una oferta específica este mes").')
});
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END

Prompt para la IA:

Eres un experto en redacción de correos de ventas B2B, especializado en crear mensajes de seguimiento persuasivos, personalizados y que aportan valor. Tu tarea es generar una plantilla de correo electrónico de seguimiento para el lead "{{leadName}}".

Información disponible:
- Lead (Nombre del Contacto o Negocio): {{{leadName}}}
{{#if businessType}}- Tipo de Negocio del Lead: {{{businessType}}}{{/if}}
- Resumen del Contexto Previo/Motivo del Seguimiento: {{{previousContextSummary}}}
{{#if desiredOutcome}}- Objetivo del Usuario para este Email: {{{desiredOutcome}}}{{/if}}
- Nombre del Remitente (Comercial): {{{senderName}}}
- Empresa del Remitente: {{{senderCompany}}}
{{#if userProducts.length}}
- Productos/Servicios del Usuario (para referencia de valor, no necesariamente para listarlos todos):
{{#each userProducts}}
  - {{this.name}}: {{this.description}} (Precio: {{this.price_usd}})
{{/each}}
{{/if}}
{{#if leadNotes}}- Notas Adicionales sobre el Lead: {{{leadNotes}}}{{/if}}

Instrucciones para el Correo de Seguimiento:
1.  **Asunto:** Crea un asunto que sea breve, relevante para el {{{previousContextSummary}}}, y que incentive la apertura. Incluye el nombre del {{{leadName}}} si es natural.
2.  **Cuerpo del Correo (Texto Plano):**
    *   **Saludo:** Personalizado (ej. "Estimado/a [Nombre del Contacto en Lead],").
    *   **Referencia Concisa:** Recuerda brevemente la interacción o el tema anterior ({{{previousContextSummary}}}).
    *   **Aporte de Valor:** Este es el núcleo. No te limites a "solo quería hacer seguimiento". Ofrece algo nuevo o reitera un punto de valor clave. Puede ser:
        *   Un recurso útil (artículo, caso de estudio breve) relacionado con sus desafíos.
        *   Una nueva idea o perspectiva sobre cómo tus servicios/productos pueden ayudarles específicamente, basándote en {{{businessType}}} o {{{previousContextSummary}}}.
        *   Una respuesta a una pregunta pendiente o una aclaración.
    *   **Llamada a la Acción (CTA):** Clara, sencilla y de bajo compromiso. Si el {{{desiredOutcome}}} es específico, alinea la CTA con él. Ejemplos: "¿Te gustaría tener una charla de 15 minutos la próxima semana para explorar esto más a fondo?", "¿Hay alguna pregunta específica que pueda responderte ahora?", "Si esto te parece interesante, aquí tienes un enlace con más detalles: [Enlace]".
    *   **Cierre:** Profesional y cordial.
    *   **Firma:** {{{senderName}}}, {{{senderCompany}}}.
3.  **Tono:** Profesional, servicial, empático y centrado en las necesidades del lead. Evita la presión.
4.  **Puntos de Personalización (Opcional):** Incluye 2-3 sugerencias sobre cómo el comercial puede personalizar aún más el borrador antes de enviarlo para maximizar su impacto.

El objetivo es reenganchar al lead, aportar valor y facilitar el siguiente paso en la conversación.
Si el {{{desiredOutcome}}} es muy específico, asegúrate que el email se enfoque en alcanzarlo.

Genera la respuesta en el formato JSON especificado.
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Text
IGNORE_WHEN_COPYING_END

-------------------------------

4. Manejo de Objeciones (Clave: "objectionHandling")

Nombre del flujo: generateObjectionHandlingGuidanceFlow.ts

Input Adicional (ejemplo): objectionRaised: z.string().describe('La objeción específica planteada por el lead (ej. "Es muy caro", "No tenemos tiempo ahora", "Ya usamos a X").'), productInDiscussion: z.object({ name: z.string(), description: z.string(), price_usd: z.string() }).optional().describe('El producto/servicio específico sobre el que se planteó la objeción.'), stageInSalesProcess: z.string().optional().describe('Etapa del proceso de ventas cuando surgió la objeción.')

Output (ejemplo):

const GenerateObjectionHandlingGuidanceOutputSchema = z.object({
  objectionCategory: z.string().describe('Categoría de la objeción (ej. Precio, Tiempo, Competencia, Necesidad).'),
  empathyStatement: z.string().describe('Una frase inicial para mostrar empatía y validar la preocupación del lead.'),
  suggestedResponses: z.array(
    z.object({
      strategyName: z.string().describe('Nombre de la estrategia de respuesta (ej. Reencuadre de Valor, Aclaración de Alcance, Comparación Diferencial, Historia de Éxito).'),
      responsePoints: z.array(z.string()).describe('Puntos clave o frases para articular la respuesta.'),
      pros: z.array(z.string()).optional().describe('Ventajas de esta estrategia.'),
      consOrWatchouts: z.array(z.string()).optional().describe('Posibles desventajas o puntos a tener cuidado con esta estrategia.')
    })
  ).min(1).max(3).describe('De 1 a 3 estrategias de respuesta sugeridas con sus puntos clave.'),
  clarifyingQuestions: z.array(z.string()).optional().describe('Preguntas que el comercial podría hacer para entender mejor la raíz de la objeción antes de responder directamente.')
});
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END

Prompt para la IA:

Eres un coach de ventas de élite, especializado en superar objeciones complejas en entornos B2B. Un comercial necesita tu ayuda para responder a una objeción planteada por el lead "{{leadName}}".

Información del Contexto:
- Lead: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio: {{{businessType}}}{{/if}}
- Objeción Planteada por el Lead: "{{{objectionRaised}}}"
{{#if productInDiscussion}}
- Producto/Servicio en Discusión:
  - Nombre: {{{productInDiscussion.name}}}
  - Descripción: {{{productInDiscussion.description}}}
  - Precio: {{{productInDiscussion.price_usd}}}
{{/if}}
{{#if stageInSalesProcess}}- Etapa del Proceso de Ventas: {{{stageInSalesProcess}}}{{/if}}
{{#if leadNotes}}- Notas Adicionales sobre el Lead: {{{leadNotes}}}{{/if}}

Tu tarea es proporcionar una guía completa para manejar esta objeción:
1.  **Categorizar la Objeción:** Identifica la categoría principal de la objeción (ej. Precio, Falta de Necesidad Percibida, Competencia, Tiempo/Urgencia, Autoridad, etc.).
2.  **Declaración de Empatía:** Redacta una frase inicial que el comercial pueda usar para reconocer la objeción del lead y mostrar comprensión, sin necesariamente estar de acuerdo.
3.  **Estrategias de Respuesta Sugeridas (1-3 opciones):**
    *   Para cada estrategia:
        *   Dale un nombre descriptivo (ej. "Reencuadrar el Precio como Inversión", "Demostrar ROI", "Aislamiento de la Objeción", "Boomerang").
        *   Detalla los puntos clave o frases que el comercial puede usar. Estos deben ser específicos y, si es posible, cuantificables.
        *   Opcionalmente, menciona brevemente las ventajas de usar esa estrategia y cualquier consideración o "cuidado con".
    *   Las respuestas deben ser constructivas, buscando educar al lead o cambiar su perspectiva, en lugar de ser defensivas.
4.  **Preguntas de Aclaración (Opcional):** Sugiere 1-2 preguntas inteligentes que el comercial podría hacer ANTES de responder, para asegurarse de que entiende completamente la preocupación del lead.

Considera la naturaleza específica de "{{{objectionRaised}}}". Adapta tus respuestas al producto/servicio {{{productInDiscussion.name}}} si se especifica.
El objetivo es equipar al comercial con herramientas para convertir la objeción en una oportunidad de diálogo y avance.

Genera la respuesta en el formato JSON especificado.
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Text
IGNORE_WHEN_COPYING_END

-------------------------------

5. Resumen Propuesta (Clave: "proposalSummary")

Nombre del flujo: generateProposalSummaryFlow.ts

Input Adicional (ejemplo): fullProposalDetails: z.object({ problemStatement: z.string(), proposedSolution: z.string(), keyDeliverables: z.array(z.string()), pricingSummary: z.string(), callToAction: z.string() }).optional().describe('Objeto detallado con las secciones clave de la propuesta.'), targetAudienceForSummary: z.string().optional().describe('A quién va dirigido este resumen (ej. Decisor principal, Equipo técnico). Default: Decisor principal.')

Output (ejemplo):

const GenerateProposalSummaryOutputSchema = z.object({
  summaryTitle: z.string().describe('Un título conciso y atractivo para el resumen de la propuesta (ej. "Propuesta de Valor para [Lead Name]: Puntos Clave").'),
  executiveSummary: z.string().describe('Un resumen ejecutivo (3-5 frases) que capture la esencia de la propuesta: el problema del lead, la solución principal, y el impacto/valor clave.'),
  keyBenefitsAlignedWithNeeds: z.array(z.object({
    need: z.string().describe('Necesidad o desafío del lead que se aborda.'),
    benefit: z.string().describe('Beneficio específico de la propuesta que aborda esa necesidad.')
  })).min(2).max(4).describe('Lista de 2-4 beneficios clave, directamente alineados con las necesidades identificadas del lead.'),
  uniqueSellingPropositionHighlight: z.string().optional().describe('Un punto que destaque la propuesta de valor única (USP) o el diferenciador principal de la oferta.'),
  suggestedNextStepFromProposal: z.string().describe('El próximo paso claro y accionable que se espera del lead, tal como se indica en la propuesta original o una versión simplificada.')
});
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END

Prompt para la IA:

Eres un consultor de comunicación estratégica, experto en destilar información compleja de propuestas de venta B2B en resúmenes ejecutivos impactantes y fáciles de digerir. Tu tarea es generar un resumen claro y persuasivo de una propuesta para el lead "{{leadName}}".

Información de la Propuesta y el Lead:
- Lead: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio del Lead: {{{businessType}}}{{/if}}
{{#if fullProposalDetails}}
- Detalles Clave de la Propuesta:
  - Problema del Cliente Abordado: {{{fullProposalDetails.problemStatement}}}
  - Solución Propuesta: {{{fullProposalDetails.proposedSolution}}}
  - Entregables Clave: {{{fullProposalDetails.keyDeliverables}}}
  - Resumen de Precios/Inversión: {{{fullProposalDetails.pricingSummary}}}
  - Llamada a la Acción de la Propuesta: {{{fullProposalDetails.callToAction}}}
{{else}}
  Por favor, proporciona al menos una descripción general de lo que se propuso.
{{/if}}
{{#if targetAudienceForSummary}}- Audiencia del Resumen: {{{targetAudienceForSummary}}}{{/if}}
{{#if leadNotes}}- Notas sobre el Lead (prioridades, preocupaciones): {{{leadNotes}}}{{/if}}

Instrucciones para el Resumen de la Propuesta:
1.  **Título del Resumen:** Crea un título que sea a la vez informativo y capte el interés del lead.
2.  **Resumen Ejecutivo:** Redacta un párrafo conciso (idealmente 3-5 frases) que articule:
    *   El principal desafío o necesidad del lead que la propuesta aborda.
    *   La esencia de la solución ofrecida.
    *   El resultado o valor más significativo que "{{{leadName}}}" obtendrá.
3.  **Beneficios Clave Alineados con Necesidades:** Identifica de 2 a 4 beneficios cruciales de la propuesta. Para cada uno, si es posible, vincula explícitamente el beneficio a una necesidad o problema conocido del lead (inferido de la información proporcionada).
4.  **Destaque de la Propuesta de Valor Única (USP) (Opcional):** Si la propuesta tiene un diferenciador claro o una USP fuerte, resáltalo brevemente.
5.  **Próximo Paso Sugerido:** Clarifica cuál es el siguiente paso que se espera del lead, idealmente tomado de la llamada a la acción de la propuesta original.

El tono debe ser profesional, confiado y centrado en el cliente. El resumen debe ser fácilmente escaneable y reforzar los puntos más importantes.
Adapta el lenguaje y el enfoque según la {{{targetAudienceForSummary}}} si se especifica (ej. más técnico para un equipo técnico, más estratégico/financiero para un decisor).
Si no se proporcionaron detalles completos de la propuesta, haz tu mejor esfuerzo para inferir y crear un resumen genérico pero útil basado en el {{{businessType}}} y cualquier nota.

Genera la respuesta en el formato JSON especificado.
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Text
IGNORE_WHEN_COPYING_END

Siguientes Acciones (Continuación):

Prepararé los prompts para competitorAnalysis, followUpReminder, negotiationTactics, negotiationStrategy, counterOffer, riskAssessment, thankYou, crossSell, customerSurvey, winBack, lossAnalysis, y competitorReport en mensajes subsiguientes si es necesario. La estructura será similar, ajustando los inputs, outputs y el rol de la IA para cada caso específico.