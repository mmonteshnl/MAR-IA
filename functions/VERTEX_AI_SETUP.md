# Vertex AI Setup Guide (Manual Configuration)

> **Nota**: Esta configuración es opcional y solo se debe implementar cuando decidas activar el Machine Learning con Vertex AI. Las Cloud Functions ya tienen fallback rule-based que funciona sin costo adicional.

## Overview

Esta guía te permite configurar Vertex AI AutoML para entrenar un modelo de predicción de leads usando los datos exportados por la Cloud Function `exportLeadsForTraining`.

## Costos Estimados

- **Dataset creation**: Gratuito
- **Model training**: ~$20-50 por entrenamiento (dependiendo del tamaño)
- **Prediction endpoint**: ~$1-3 por hora mientras esté activo
- **Predictions**: ~$0.50 por 1000 predicciones

## Prerequisitos

1. Cloud Functions desplegadas (`exportLeadsForTraining`, `getLeadPrediction`)
2. Al menos 100 leads con estados finales ('Ganado'/'Perdido') en Firestore
3. Bucket de Cloud Storage configurado
4. Vertex AI API habilitada en tu proyecto

## Paso 1: Habilitar APIs Requeridas

```bash
# Habilitar Vertex AI API
gcloud services enable aiplatform.googleapis.com

# Habilitar AutoML API
gcloud services enable automl.googleapis.com

# Verificar que las APIs están habilitadas
gcloud services list --enabled | grep -E "(aiplatform|automl)"
```

## Paso 2: Configurar Permisos IAM

```bash
# Agregar rol de Vertex AI Admin
gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
  --member="user:YOUR-EMAIL@domain.com" \
  --role="roles/aiplatform.admin"

# Agregar rol para Cloud Functions
gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
  --member="serviceAccount:YOUR-FUNCTIONS-SA@PROJECT.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

## Paso 3: Generar Datos de Entrenamiento

### Ejecutar Export Function

```bash
# Activar la función de exportación manualmente
curl -X POST https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/exportLeadsForTraining \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{"organizationId": "YOUR-ORG-ID"}'
```

### Verificar Datos Exportados

```bash
# Listar archivos CSV generados
gsutil ls gs://mar-ia-ml-training/training-datasets/

# Inspeccionar el CSV más reciente
gsutil cat gs://mar-ia-ml-training/training-datasets/training-data-*.csv | head -10
```

### Validar Estructura de Datos

El CSV debe tener estas columnas:

```csv
leadSource,leadIndustry,leadValue,leadUrgency,companySize,contactMethod,initialResponseTime,followUpCount,daysInPipeline,hasPhone,hasEmail,hasWhatsApp,budgetQualified,authorityConfirmed,needIdentified,timelineEstablished,leadScore,engagementLevel,finalOutcome
META_ADS,technology,50000,high,large,email,2,3,15,1,1,1,1,1,1,1,85,medium,Ganado
GOOGLE_ADS,retail,25000,medium,medium,phone,4,2,22,1,1,0,1,0,1,0,65,low,Perdido
...
```

## Paso 4: Crear Dataset en Vertex AI

### Via Console (Recomendado)

1. Ve a [Google Cloud Console → Vertex AI → Datasets](https://console.cloud.google.com/vertex-ai/datasets)
2. Click **"CREATE DATASET"**
3. Configuración:
   - **Dataset name**: `lead-prediction-dataset-v1`
   - **Data type**: `Tabular`
   - **Objective**: `Classification`
4. **Select data source**:
   - Choose **"Select CSV files from Cloud Storage"**
   - Path: `gs://mar-ia-ml-training/training-datasets/training-data-LATEST.csv`
5. **Generate statistics**: Enable
6. Click **"CREATE"**

### Via Command Line (Alternativo)

```bash
# Crear dataset
gcloud ai datasets create \
  --display-name="lead-prediction-dataset-v1" \
  --metadata-schema-uri="gs://google-cloud-aiplatform/schema/dataset/metadata/tabular_1.0.0.yaml" \
  --region=us-central1

# Importar datos
gcloud ai datasets import \
  --dataset=DATASET-ID \
  --data-source-uri="gs://mar-ia-ml-training/training-datasets/training-data-LATEST.csv" \
  --import-schema-uri="gs://google-cloud-aiplatform/schema/dataset/ioformat/csv_io_format_1.0.0.yaml" \
  --region=us-central1
```

## Paso 5: Entrenar Modelo AutoML

### Via Console (Recomendado)

1. En el dataset creado, click **"TRAIN NEW MODEL"**
2. **Training method**: `AutoML`
3. **Model details**:
   - **Model name**: `lead-prediction-model-v1`
   - **Target column**: `finalOutcome`
   - **Prediction type**: `Classification`
4. **Training options**:
   - **Budget**: 1-8 node hours (recomendado: 2-4 para empezar)
   - **Exclude columns**: Ninguna (usar todas las features)
5. **Advanced options**:
   - **Optimization objective**: `AUC ROC` (mejor para predicciones balanceadas)
   - **Model interpretability**: Enable (para feature importance)
6. Click **"START TRAINING"**

### Monitorear Entrenamiento

```bash
# Listar trabajos de entrenamiento
gcloud ai training-jobs list --region=us-central1

# Ver detalles de un trabajo específico
gcloud ai training-jobs describe TRAINING-JOB-ID --region=us-central1
```

## Paso 6: Evaluar Modelo

Una vez completado el entrenamiento:

1. **Review metrics**:
   - **AUC ROC**: Debe ser > 0.7 (preferiblemente > 0.8)
   - **Precision/Recall**: Balanceados para ambas clases
   - **Confusion Matrix**: Verificar falsos positivos/negativos

2. **Feature Importance**:
   - Identificar las features más importantes
   - Validar que tenga sentido business (ej: leadValue, leadScore)

3. **Test Predictions**:
   - Usar la pestaña "TEST" en la consola
   - Probar con datos de ejemplo

## Paso 7: Desplegar Endpoint

### Via Console

1. En el modelo entrenado, click **"DEPLOY TO ENDPOINT"**
2. **Endpoint details**:
   - **Endpoint name**: `lead-prediction-endpoint-v1`
   - **Region**: `us-central1`
3. **Machine specifications**:
   - **Machine type**: `n1-standard-2` (para empezar)
   - **Minimum nodes**: 1
   - **Maximum nodes**: 3 (para auto-scaling)
4. Click **"DEPLOY"**

### Via Command Line

```bash
# Crear endpoint
gcloud ai endpoints create \
  --display-name="lead-prediction-endpoint-v1" \
  --region=us-central1

# Desplegar modelo al endpoint
gcloud ai endpoints deploy-model ENDPOINT-ID \
  --model=MODEL-ID \
  --display-name="lead-prediction-deployment-v1" \
  --machine-type=n1-standard-2 \
  --min-replica-count=1 \
  --max-replica-count=3 \
  --region=us-central1
```

## Paso 8: Configurar Cloud Functions

### Actualizar Variables de Entorno

```bash
# Configurar endpoint ID en Functions
firebase functions:config:set \
  vertex.endpoint="ENDPOINT-ID" \
  vertex.project="YOUR-PROJECT-ID" \
  vertex.region="us-central1"

# Redesplegar funciones con nueva configuración
firebase deploy --only functions:getLeadPrediction
```

### Probar Integración

```bash
# Probar predicción con nuevo modelo
curl -X POST https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/getLeadPrediction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "organizationId": "YOUR-ORG-ID",
    "leadData": {
      "email": "test@example.com",
      "source": "META_ADS",
      "industry": "technology",
      "estimatedValue": 50000,
      "urgency": "high",
      "companySize": "large",
      "budgetQualified": true,
      "authorityConfirmed": true
    }
  }'
```

## Paso 9: Automatización y Monitoring

### Re-entrenar Modelo Periódicamente

```bash
# Crear Cloud Scheduler job para re-entrenamiento mensual
gcloud scheduler jobs create http monthly-model-retrain \
  --schedule="0 2 1 * *" \
  --uri="https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/exportLeadsForTraining" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --message-body='{"organizationId":"YOUR-ORG-ID","triggerRetraining":true}'
```

### Configurar Alertas

```bash
# Alerta por degradación de modelo
gcloud alpha monitoring policies create --policy-from-file=model-performance-alert.yaml
```

### model-performance-alert.yaml

```yaml
displayName: "Lead Prediction Model Performance"
conditions:
  - displayName: "Low Prediction Accuracy"
    conditionThreshold:
      filter: 'resource.type="vertex_ai_endpoint"'
      comparison: COMPARISON_LESS_THAN
      thresholdValue: 0.7
combiner: OR
```

## Optimización de Costos

### 1. Auto-scaling del Endpoint

```bash
# Configurar auto-scaling más agresivo
gcloud ai endpoints update-deployed-model ENDPOINT-ID \
  --deployed-model-id=DEPLOYED-MODEL-ID \
  --min-replica-count=0 \
  --max-replica-count=2 \
  --region=us-central1
```

### 2. Scheduled Scaling

```bash
# Crear jobs para escalar down en horarios no laborales
gcloud scheduler jobs create http scale-down-endpoint \
  --schedule="0 18 * * 1-5" \
  --uri="https://aiplatform.googleapis.com/v1/projects/YOUR-PROJECT/locations/us-central1/endpoints/ENDPOINT-ID:undeploy" \
  --http-method=POST
```

### 3. Batch Predictions (Más Barato)

Para predicciones en lote, usar batch prediction en lugar del endpoint:

```bash
# Batch prediction job
gcloud ai batch-prediction-jobs create \
  --model=MODEL-ID \
  --input-uri="gs://your-bucket/batch-input.jsonl" \
  --output-uri="gs://your-bucket/batch-output/" \
  --region=us-central1
```

## Troubleshooting

### Error: Insufficient Training Data

```bash
# Verificar cantidad de datos por clase
gsutil cat gs://mar-ia-ml-training/training-datasets/training-data-*.csv | \
  awk -F',' '{print $NF}' | sort | uniq -c
```

Necesitas al menos 50 ejemplos de cada clase (Ganado/Perdido).

### Error: Feature Correlation Issues

Si AutoML reporta problemas de correlación:

1. Remover features altamente correlacionadas
2. Usar feature engineering diferente
3. Aumentar diversidad de datos

### Error: Model Performance Poor

Si AUC ROC < 0.6:

1. **Revisar features**: ¿Son relevantes para predecir éxito?
2. **Más datos**: Recopilar más leads históricos
3. **Balance de clases**: Asegurar proporción similar de Ganado/Perdido
4. **Feature engineering**: Crear features más discriminativas

### Error: Endpoint Timeout

```bash
# Aumentar timeout en Cloud Functions
# En functions/getLeadPrediction.js
exports.getLeadPrediction = functions
  .runWith({ timeoutSeconds: 540 })
  .https.onRequest(handler);
```

## Métricas de Éxito

### Modelo Entrenado
- **AUC ROC**: > 0.75
- **Precision**: > 0.70 para ambas clases
- **Recall**: > 0.70 para ambas clases

### Producción
- **Latencia**: < 2 segundos por predicción
- **Disponibilidad**: > 99.9%
- **Costo**: < $100/mes para 1000 predicciones/día

## Referencias

- [Vertex AI AutoML Documentation](https://cloud.google.com/vertex-ai/docs/start/automl-users)
- [Cloud Functions + Vertex AI Integration](https://cloud.google.com/functions/docs/samples/functions-vertex-ai)
- [AutoML Best Practices](https://cloud.google.com/vertex-ai/docs/training/automl-api)