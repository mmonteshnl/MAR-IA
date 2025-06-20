# Cloud Functions Deployment Guide

## Configuración Inicial

### 1. Prerequisitos

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Instalar dependencias del proyecto
cd functions
npm install

# Login a Firebase
firebase login
```

### 2. Configuración del Proyecto

```bash
# Seleccionar proyecto de Firebase
firebase use --add

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores específicos
```

### 3. Variables de Entorno Requeridas

```bash
# En Firebase Functions config
firebase functions:config:set \
  ml.bucket="mar-ia-ml-training" \
  ml.region="us-central1" \
  vertex.endpoint="your-endpoint-id"
```

## Deployment

### Desplegar Todas las Funciones

```bash
# Desde el directorio functions/
npm run deploy
```

### Desplegar Funciones Específicas

```bash
# Solo función de exportación
firebase deploy --only functions:exportLeadsForTraining

# Solo función de predicción  
firebase deploy --only functions:getLeadPrediction

# Solo función programada
firebase deploy --only functions:scheduledMLExport
```

## Testing Local

### Emular Funciones Localmente

```bash
# Iniciar emuladores
firebase emulators:start --only functions

# Las funciones estarán disponibles en:
# http://localhost:5001/YOUR-PROJECT/us-central1/FUNCTION-NAME
```

### Probar Función de Exportación

```bash
curl -X POST http://localhost:5001/YOUR-PROJECT/us-central1/exportLeadsForTraining \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{"organizationId": "test-org"}'
```

### Probar Función de Predicción

```bash
curl -X POST http://localhost:5001/YOUR-PROJECT/us-central1/getLeadPrediction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{
    "organizationId": "test-org",
    "leadData": {
      "email": "test@example.com",
      "phone": "+1234567890",
      "source": "META_ADS",
      "industry": "restaurant",
      "estimatedValue": 25000,
      "urgency": "high"
    }
  }'
```

## Configuración de Cloud Storage

### Crear Bucket para ML

```bash
# Crear bucket
gsutil mb gs://mar-ia-ml-training

# Configurar permisos
gsutil iam ch serviceAccount:YOUR-FUNCTIONS-SA@PROJECT.iam.gserviceaccount.com:objectAdmin gs://mar-ia-ml-training

# Configurar CORS si es necesario
gsutil cors set cors.json gs://mar-ia-ml-training
```

### Archivo cors.json

```json
[
  {
    "origin": ["https://YOUR-DOMAIN.com"],
    "method": ["GET", "POST"],
    "maxAgeSeconds": 3600
  }
]
```

## Configuración de Cloud Scheduler

### Crear Job para Exportación Semanal

```bash
gcloud scheduler jobs create pubsub weekly-ml-export \
  --schedule="0 2 * * 1" \
  --topic="weekly-ml-export" \
  --message-body='{"trigger":"scheduled"}' \
  --time-zone="America/Mexico_City"
```

## Monitoring y Logs

### Ver Logs de Funciones

```bash
# Logs en tiempo real
firebase functions:log

# Logs de función específica
firebase functions:log --only exportLeadsForTraining

# Logs con filtros
firebase functions:log --since 1h
```

### Logs en Google Cloud Console

```bash
# URL para logs
https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_function%22
```

## Troubleshooting

### Errores Comunes

1. **Error de permisos de Firestore**
   ```bash
   # Verificar reglas de Firestore
   firebase firestore:rules --help
   ```

2. **Error de bucket de Cloud Storage**
   ```bash
   # Verificar que el bucket existe
   gsutil ls gs://mar-ia-ml-training
   ```

3. **Error de timeout**
   ```bash
   # Aumentar timeout en firebase.json
   {
     "functions": {
       "timeout": "540s"
     }
   }
   ```

### Debug Mode

```bash
# Activar logs detallados
export GOOGLE_CLOUD_PROJECT=your-project-id
export FIREBASE_CONFIG='{"projectId":"your-project-id"}'
```

## Security Best Practices

### 1. Configurar IAM Roles

```bash
# Rol mínimo para Cloud Functions
gcloud projects add-iam-policy-binding YOUR-PROJECT \
  --member="serviceAccount:YOUR-SA@PROJECT.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### 2. Configurar CORS

```javascript
// En cada función HTTP
res.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*');
res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

### 3. Validación de Tokens

```javascript
// Verificar token de Firebase Auth
const admin = require('firebase-admin');

async function verifyToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  
  return await admin.auth().verifyIdToken(token);
}
```

## Performance Optimization

### 1. Configurar Memory y CPU

```javascript
// En cada función
exports.myFunction = functions
  .runWith({
    memory: '1GB',
    timeoutSeconds: 540
  })
  .https.onRequest(handler);
```

### 2. Connection Pooling

```javascript
// Reusar instancias de admin
if (!admin.apps.length) {
  admin.initializeApp();
}
```

### 3. Caching

```javascript
// Cache de predicciones
const predictionCache = new Map();

function getCachedPrediction(leadId) {
  return predictionCache.get(leadId);
}
```

## Rollback Strategy

### Revertir a Versión Anterior

```bash
# Listar versiones
gcloud functions versions list --filter="name:FUNCTION-NAME"

# Revertir función específica
gcloud functions deploy FUNCTION-NAME --source=gs://BUCKET/VERSION
```

### Backup de Base de Datos

```bash
# Exportar Firestore
gcloud firestore export gs://backup-bucket/backup-$(date +%Y-%m-%d)
```

## Costs Monitoring

### Configurar Alertas de Costo

```bash
# Crear presupuesto
gcloud beta billing budgets create \
  --billing-account=BILLING-ACCOUNT-ID \
  --display-name="ML Functions Budget" \
  --budget-amount=50USD
```

### Optimización de Costos

1. **Usar regiones más baratas** (us-central1)
2. **Limitar concurrencia** para evitar picos
3. **Implementar rate limiting**
4. **Monitorear invocaciones** excesivas

## Production Checklist

- [ ] Variables de entorno configuradas
- [ ] Bucket de ML creado y configurado
- [ ] Permisos IAM correctos
- [ ] Cloud Scheduler configurado
- [ ] Logs funcionando
- [ ] Alertas de error configuradas
- [ ] Backup strategy implementada
- [ ] Monitoring dashboard configurado
- [ ] Load testing completado