# =============================================================================
# 1. INICIAR LLAMADA (Flujo 1)
# =============================================================================

curl -X POST "https://mar-ia.aludra.com/api/flows/dev-execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_api_token" \
  -H "X-Organization-ID: tu_organization_id" \
  -d '{
    "flowAlias": "iniciar-llamada-ia-a-lead",
    "inputData": {
      "id": "lead_123",
      "fullName": "Clínica de Rehabilitación San José",
      "phone": "+5215551234567",
      "businessType": "Clínica de Rehabilitación",
      "organizationId": "org_abc_123",
      "source": "website_form",
      "interestArea": "equipos_hipoterapia",
      "currentEquipment": "equipos_basicos",
      "patientsPerMonth": "150"
    }
  }'

# =============================================================================
# 2. WEBHOOK DE RESULTADO (Flujo 2) - Llamada que hace ElevenLabs
# =============================================================================

curl -X POST "https://mar-ia.aludra.com/api/flows/webhook/procesar-resultado-llamada-ia" \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "call_123abc",
    "status": "completed",
    "duration_seconds": 180,
    "transcript": "Hola Dr. Martínez, gracias por atender. Soy Sofia de Hiposat México. Veo que manejan una clínica de rehabilitación, estamos ayudando a centros como el suyo a mejorar los resultados de sus pacientes con nuestros equipos de hipoterapia de última generación. ¿Le gustaría agendar una demostración para mostrarle cómo nuestros equipos pueden beneficiar a sus pacientes?",
    "outcome": "appointment_scheduled",
    "confidence": 0.95,
    "startTime": "2025-06-20T10:30:00Z",
    "endTime": "2025-06-20T10:33:00Z",
    "metadata": {
      "crm_lead_id": "lead_123",
      "crm_organization_id": "org_abc_123",
      "lead_name": "Clínica de Rehabilitación San José",
      "business_type": "Clínica de Rehabilitación"
    }
  }'

# =============================================================================
# EJEMPLOS ADICIONALES - EQUIPOS HIPOSAT
# =============================================================================

# Ejemplo 2: Centro deportivo
curl -X POST "https://mar-ia.aludra.com/api/flows/dev-execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_api_token" \
  -H "X-Organization-ID: tu_organization_id" \
  -d '{
    "flowAlias": "iniciar-llamada-ia-a-lead",
    "inputData": {
      "id": "lead_456",
      "fullName": "Centro Deportivo Élite",
      "phone": "+5215559876543",
      "businessType": "Centro Deportivo",
      "organizationId": "org_abc_123",
      "lastContact": "2025-06-15",
      "stage": "interested",
      "currentServices": "fisioterapia_basica",
      "athletesPerMonth": "200"
    }
  }'

# Ejemplo 3: Hospital
curl -X POST "https://mar-ia.aludra.com/api/flows/dev-execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_api_token" \
  -H "X-Organization-ID: tu_organization_id" \
  -d '{
    "flowAlias": "iniciar-llamada-ia-a-lead",
    "inputData": {
      "id": "lead_789",
      "fullName": "Hospital General del Norte",
      "phone": "+5215558887777",
      "businessType": "Hospital",
      "organizationId": "org_abc_123",
      "department": "rehabilitacion",
      "beds": "150",
      "interestArea": "equipos_avanzados_hipoterapia"
    }
  }'

# Ejemplo 4: Spa y Bienestar
curl -X POST "https://mar-ia.aludra.com/api/flows/dev-execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_api_token" \
  -H "X-Organization-ID: tu_organization_id" \
  -d '{
    "flowAlias": "iniciar-llamada-ia-a-lead",
    "inputData": {
      "id": "lead_101",
      "fullName": "Spa Wellness Center",
      "phone": "+5215556669999",
      "businessType": "Spa y Bienestar",
      "organizationId": "org_abc_123",
      "services": "terapias_alternativas",
      "clientsPerWeek": "80",
      "interestArea": "equipos_relajacion_hipoterapia"
    }
  }'

# Ejemplo 5: Webhook con resultado negativo
curl -X POST "https://mar-ia.aludra.com/api/flows/webhook/procesar-resultado-llamada-ia" \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "call_456def",
    "status": "completed",
    "duration_seconds": 45,
    "transcript": "Hola, soy Sofia de Hiposat México. Buenos días, muchas gracias pero en este momento no estamos buscando nuevos equipos, ya tenemos proveedores establecidos.",
    "outcome": "not_interested",
    "confidence": 0.88,
    "startTime": "2025-06-20T14:15:00Z",
    "endTime": "2025-06-20T14:15:45Z",
    "metadata": {
      "crm_lead_id": "lead_456",
      "crm_organization_id": "org_abc_123",
      "lead_name": "Centro Deportivo Élite",
      "business_type": "Centro Deportivo"
    }
  }'

# Ejemplo 6: Webhook hospital interesado en demo
curl -X POST "https://mar-ia.aludra.com/api/flows/webhook/procesar-resultado-llamada-ia" \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "call_789ghi",
    "status": "completed",
    "duration_seconds": 240,
    "transcript": "Buenos días, soy Sofia de Hiposat México. Hola Sofia, me interesa mucho conocer más sobre sus equipos de hipoterapia. Hemos estado evaluando opciones para mejorar nuestro departamento de rehabilitación. ¿Podrían venir a hacer una demostración la próxima semana?",
    "outcome": "appointment_scheduled",
    "confidence": 0.92,
    "startTime": "2025-06-20T11:00:00Z",
    "endTime": "2025-06-20T11:04:00Z",
    "metadata": {
      "crm_lead_id": "lead_789",
      "crm_organization_id": "org_abc_123",
      "lead_name": "Hospital General del Norte",
      "business_type": "Hospital"
    }
  }'

# =============================================================================
# RESPUESTAS ESPERADAS
# =============================================================================

# Respuesta exitosa del Flujo 1:
# {
#   "success": true,
#   "callId": "call_123abc",
#   "estimatedDuration": 180,
#   "scheduledAt": "2025-06-20T10:30:00Z",
#   "message": "Llamada iniciada exitosamente"
# }

# Respuesta de error:
# {
#   "success": false,
#   "error": "INVALID_PHONE_FORMAT",
#   "message": "El número telefónico debe estar en formato internacional",
#   "details": {
#     "field": "phone",
#     "received": "123456789",
#     "expected": "+1234567890"
#   }
# }