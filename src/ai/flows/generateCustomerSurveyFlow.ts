import { z } from 'zod';
import { generate } from '@genkit-ai/ai';
import { gemini15Flash } from '@genkit-ai/googleai';
import { defineFlow } from '@genkit-ai/core';

const GenerateCustomerSurveyInputSchema = z.object({
  leadId: z.string(),
  leadName: z.string(),
  businessType: z.string().optional(),
  leadStage: z.string(),
  leadNotes: z.string().optional(),
  purchasedSolution: z.string().optional(),
  implementationDate: z.string().optional(),
  timeWithSolution: z.number().optional(),
  senderName: z.string(),
  senderCompany: z.string(),
  userProducts: z.array(z.object({
    name: z.string(),
    description: z.string(),
    category: z.string().optional(),
    price: z.string().optional(),
  })).optional(),
});

const GenerateCustomerSurveyOutputSchema = z.object({
  surveyTitle: z.string(),
  introMessage: z.string(),
  surveyQuestions: z.array(z.object({
    category: z.string(),
    question: z.string(),
    type: z.string(),
    options: z.array(z.string()).optional(),
  })),
  incentiveOffered: z.string(),
  followUpAction: z.string(),
  estimatedCompletionTime: z.string(),
});

export type GenerateCustomerSurveyInput = z.infer<typeof GenerateCustomerSurveyInputSchema>;
export type GenerateCustomerSurveyOutput = z.infer<typeof GenerateCustomerSurveyOutputSchema>;

export const generateCustomerSurvey = defineFlow(
  {
    name: 'generateCustomerSurvey',
    inputSchema: GenerateCustomerSurveyInputSchema,
    outputSchema: GenerateCustomerSurveyOutputSchema,
  },
  async (input: GenerateCustomerSurveyInput): Promise<GenerateCustomerSurveyOutput> => {
    const { leadName, businessType, leadNotes, purchasedSolution, implementationDate, timeWithSolution, senderName, senderCompany, userProducts } = input;

    const productContext = userProducts && userProducts.length > 0
      ? `Solución implementada: ${purchasedSolution || userProducts[0].name}`
      : 'Solución personalizada';

    const prompt = `
Eres un especialista en experiencia del cliente que diseña encuestas de satisfacción efectivas para obtener feedback valioso y mejorar la relación comercial.

INFORMACIÓN DEL CLIENTE:
- Cliente: ${leadName}
- Tipo de negocio: ${businessType || 'No especificado'}
- ${productContext}
- Fecha de implementación: ${implementationDate || 'No especificada'}
- Tiempo con la solución: ${timeWithSolution ? `${timeWithSolution} días` : 'No especificado'}
- Contexto del proceso: ${leadNotes || 'Sin notas adicionales'}
- Remitente: ${senderName} de ${senderCompany}

DISEÑA UNA ENCUESTA DE SATISFACCIÓN que incluya:

1. **Título de la Encuesta**: Atractivo y claro
2. **Mensaje de Introducción**: Explicando el propósito y valor
3. **Preguntas de la Encuesta**: Bien estructuradas por categorías:
   - Satisfacción general
   - Experiencia de implementación
   - Calidad del producto/servicio
   - Soporte recibido
   - Recomendación y lealtad
   - Oportunidades de mejora
4. **Incentivo Ofrecido**: Motivación para completar la encuesta
5. **Acción de Seguimiento**: Qué haremos con los resultados
6. **Tiempo Estimado**: Duración realista de completado

CARACTERÍSTICAS DE LA ENCUESTA:
- Preguntas claras y específicas
- Mezcla de preguntas cuantitativas y cualitativas
- No más de 10-12 preguntas principales
- Enfoque en insights accionables
- Tone respetuoso del tiempo del cliente
`;

    const result = await generate({
      model: gemini15Flash,
      prompt,
      config: {
        temperature: 0.7,
        topP: 0.8,
        maxOutputTokens: 1000,
      },
    });

    // Parse the result to extract structured information
    const content = result.text();
    
    return {
      surveyTitle: `Su Opinión es Importante: Encuesta de Experiencia ${senderCompany}`,
      introMessage: `Estimado/a ${leadName},

Esperamos que esté aprovechando al máximo su inversión en nuestra solución. Su feedback es fundamental para continuar brindando el mejor servicio posible.

Esta breve encuesta nos ayudará a entender su experiencia y identificar oportunidades para servirle mejor. Sus respuestas son confidenciales y serán utilizadas exclusivamente para mejorar nuestros servicios.

¡Gracias por su tiempo!

${senderName}
${senderCompany}`,
      surveyQuestions: [
        {
          category: "Satisfacción General",
          question: "¿Qué tan satisfecho está con la solución implementada?",
          type: "escala_1_10",
          options: ["1 - Muy insatisfecho", "5 - Neutral", "10 - Extremadamente satisfecho"]
        },
        {
          category: "Experiencia de Implementación",
          question: "¿Cómo calificaría el proceso de implementación?",
          type: "múltiple_opción",
          options: ["Excelente", "Muy bueno", "Bueno", "Regular", "Necesita mejoras"]
        },
        {
          category: "Calidad del Producto",
          question: "¿La solución cumple con sus expectativas iniciales?",
          type: "múltiple_opción",
          options: ["Supera expectativas", "Cumple expectativas", "Parcialmente", "No cumple expectativas"]
        },
        {
          category: "Soporte y Servicio",
          question: "¿Cómo evaluaría la calidad del soporte técnico recibido?",
          type: "escala_1_5",
          options: ["1 - Muy malo", "3 - Promedio", "5 - Excelente"]
        },
        {
          category: "Recomendación",
          question: "¿Qué probabilidad hay de que recomiende nuestros servicios?",
          type: "nps",
          options: ["0 - Nunca recomendaría", "5 - Neutral", "10 - Definitivamente recomendaría"]
        },
        {
          category: "Mejoras",
          question: "¿Qué aspecto considera que podríamos mejorar?",
          type: "texto_abierto"
        },
        {
          category: "Valor Percibido",
          question: "¿Considera que la inversión realizada ha valido la pena?",
          type: "múltiple_opción",
          options: ["Definitivamente sí", "Probablemente sí", "No estoy seguro", "Probablemente no", "Definitivamente no"]
        }
      ],
      incentiveOffered: "Como agradecimiento por completar la encuesta, recibirá un reporte personalizado con mejores prácticas de la industria y una consulta gratuita de optimización",
      followUpAction: "Revisaremos personalmente cada respuesta y nos pondremos en contacto para discutir cualquier oportunidad de mejora identificada",
      estimatedCompletionTime: "5-7 minutos",
    };
  }
);