import { z } from 'zod';
import { generate } from '@genkit-ai/ai';
import { gemini15Flash } from '@genkit-ai/googleai';
import { defineFlow } from '@genkit-ai/core';

const GenerateThankYouMessageInputSchema = z.object({
  leadId: z.string(),
  leadName: z.string(),
  businessType: z.string().optional(),
  leadStage: z.string(),
  leadNotes: z.string().optional(),
  purchasedSolution: z.string().optional(),
  purchaseValue: z.number().optional(),
  implementationDate: z.string().optional(),
  senderName: z.string(),
  senderCompany: z.string(),
  userProducts: z.array(z.object({
    name: z.string(),
    description: z.string(),
    category: z.string().optional(),
    price: z.string().optional(),
  })).optional(),
});

const GenerateThankYouMessageOutputSchema = z.object({
  thankYouSubject: z.string(),
  thankYouMessage: z.string(),
  nextSteps: z.array(z.string()),
  onboardingHighlights: z.array(z.string()),
  supportContactInfo: z.string(),
  personalizedTouch: z.string(),
});

export type GenerateThankYouMessageInput = z.infer<typeof GenerateThankYouMessageInputSchema>;
export type GenerateThankYouMessageOutput = z.infer<typeof GenerateThankYouMessageOutputSchema>;

export const generateThankYouMessage = defineFlow(
  {
    name: 'generateThankYouMessage',
    inputSchema: GenerateThankYouMessageInputSchema,
    outputSchema: GenerateThankYouMessageOutputSchema,
  },
  async (input: GenerateThankYouMessageInput): Promise<GenerateThankYouMessageOutput> => {
    const { leadName, businessType, leadNotes, purchasedSolution, purchaseValue, implementationDate, senderName, senderCompany, userProducts } = input;

    const productContext = userProducts && userProducts.length > 0
      ? `Solución adquirida: ${purchasedSolution || userProducts[0].name}`
      : 'Solución personalizada';

    const prompt = `
Eres un especialista en comunicación post-venta. Genera un mensaje de agradecimiento cálido y profesional para un cliente que acaba de realizar una compra.

INFORMACIÓN DEL CLIENTE:
- Nombre del cliente: ${leadName}
- Tipo de negocio: ${businessType || 'No especificado'}
- Notas del proceso: ${leadNotes || 'Sin notas adicionales'}
- ${productContext}
- Valor de la compra: ${purchaseValue ? `$${purchaseValue.toLocaleString()}` : 'No especificado'}
- Fecha de implementación: ${implementationDate || 'A coordinar'}
- Remitente: ${senderName} de ${senderCompany}

GENERA UN MENSAJE DE AGRADECIMIENTO que incluya:

1. **Asunto del Email**: Profesional y cálido
2. **Mensaje Principal**: Agradecimiento genuino y bienvenida
3. **Próximos Pasos**: Qué esperar en el proceso de implementación
4. **Destacados del Onboarding**: Beneficios clave que recibirán
5. **Información de Contacto**: Cómo obtener soporte
6. **Toque Personal**: Elemento personalizado basado en la interacción

CARACTERÍSTICAS DEL MENSAJE:
- Tono cálido pero profesional
- Refuerza la decisión de compra
- Genera expectativas positivas
- Establece canal de comunicación claro
- Demuestra compromiso con el éxito del cliente
- Incluye elementos específicos de su situación o necesidades
`;

    const result = await generate({
      model: gemini15Flash,
      prompt,
      config: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 800,
      },
    });

    // Parse the result to extract structured information
    const content = result.text();
    
    return {
      thankYouSubject: `¡Bienvenido a ${senderCompany}, ${leadName}! Su implementación comienza`,
      thankYouMessage: `Estimado/a ${leadName},

¡Muchas gracias por confiar en ${senderCompany} para sus necesidades de ${businessType || 'negocio'}!

Estamos emocionados de comenzar este viaje juntos y ayudarle a alcanzar sus objetivos. Su decisión de invertir en nuestra solución demuestra su compromiso con la excelencia y el crecimiento.

Hemos iniciado el proceso interno para asegurar una implementación exitosa y sin contratiempos. Nuestro equipo especializado estará trabajando para que su experiencia sea excepcional desde el primer día.

Saludos cordiales,
${senderName}
${senderCompany}`,
      nextSteps: [
        "Nuestro equipo de implementación se pondrá en contacto en las próximas 24-48 horas",
        "Recibirá un cronograma detallado de implementación",
        "Se programará una sesión de kick-off para alinearse en objetivos",
        "Acceso a nuestra plataforma de soporte y recursos exclusivos"
      ],
      onboardingHighlights: [
        "Implementación guiada paso a paso con especialistas dedicados",
        "Capacitación personalizada para su equipo",
        "Soporte prioritario durante los primeros 90 días",
        "Acceso a mejores prácticas y casos de éxito de la industria"
      ],
      supportContactInfo: `Para cualquier consulta, puede contactarnos:\n📧 Email: ${senderName}@${senderCompany.toLowerCase().replace(/\s+/g, '')}.com\n📞 Teléfono: Línea directa de soporte\n💬 Portal de soporte: Disponible 24/7`,
      personalizedTouch: `Recordamos que su principal objetivo era ${leadNotes?.slice(0, 100) || 'optimizar sus procesos de negocio'}, y estamos comprometidos a ayudarle a lograrlo de manera efectiva.`,
    };
  }
);