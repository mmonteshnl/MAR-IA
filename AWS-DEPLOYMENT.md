# AWS Deployment Guide

Este proyecto está configurado para desplegarse en AWS usando dos métodos diferentes:

## Opción 1: AWS Amplify (Recomendado para desarrollo rápido)

### Pasos:
1. **Conectar repositorio en AWS Amplify**
   - Ve a AWS Amplify Console
   - Conecta tu repositorio Git
   - Amplify detectará automáticamente `amplify.yml`

2. **Configurar variables de entorno**
   - En Amplify Console → Environment variables
   - Copia las variables de `.env.aws` y configúralas

3. **Deploy**
   - Amplify hará el build y deploy automáticamente
   - Obtendrás una URL como: `https://main.d1234567890.amplifyapp.com`

### Pros:
- ✅ Setup super rápido (5 minutos)
- ✅ CI/CD automático
- ✅ CDN global incluido
- ✅ SSL automático

### Contras:
- ❌ Menos control sobre infraestructura
- ❌ Funciones serverless limitadas

---

## Opción 2: AWS ECS con Fargate (Para producción enterprise)

### Prerrequisitos:
1. **AWS CLI configurado**
   ```bash
   aws configure
   ```

2. **Docker funcionando**
   ```bash
   docker --version
   ```

### Pasos:

#### 1. Crear ECR Repository
```bash
aws ecr create-repository --repository-name nextn-app
```

#### 2. Build y Push Docker Image
```bash
# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t nextn-app .

# Tag image
docker tag nextn-app:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/nextn-app:latest

# Push image
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/nextn-app:latest
```

#### 3. Deploy ECS Service
```bash
# Deploy using CloudFormation
aws cloudformation create-stack \
  --stack-name nextn-app-stack \
  --template-body file://ecs-service.yml \
  --parameters ParameterKey=ImageUri,ParameterValue=YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/nextn-app:latest \
  --capabilities CAPABILITY_NAMED_IAM
```

#### 4. Configurar Secrets Manager
```bash
# Create Firebase secrets
aws secretsmanager create-secret \
  --name "nextn-app/firebase" \
  --secret-string '{"FIREBASE_PROJECT_ID":"your-project-id","FIREBASE_PRIVATE_KEY":"your-private-key","FIREBASE_CLIENT_EMAIL":"your-email"}'

# Create OpenAI secret
aws secretsmanager create-secret \
  --name "nextn-app/openai" \
  --secret-string '{"OPENAI_API_KEY":"your-api-key"}'
```

### Pros:
- ✅ Control completo sobre infraestructura
- ✅ Escalado automático
- ✅ Monitoreo avanzado
- ✅ Secrets Manager integrado

### Contras:
- ❌ Setup más complejo
- ❌ Requiere conocimiento de AWS

---

## Configuración de Variables de Entorno

### Para Amplify:
Configura estas variables en Amplify Console:

```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_PRIVATE_KEY=tu-clave-privada
FIREBASE_CLIENT_EMAIL=tu-email-servicio
OPENAI_API_KEY=tu-api-key-openai
```

### Para ECS:
Las variables se configuran en `aws-task-definition.json` y AWS Secrets Manager.

---

## Comandos Útiles

### Testing Local con Docker:
```bash
# Build
docker build -t nextn-app .

# Run
docker run -p 3047:3047 --env-file .env nextn-app

# Test
curl http://localhost:3047
```

### Monitoreo:
```bash
# Ver logs de ECS
aws logs tail /ecs/nextn-app --follow

# Ver status del servicio
aws ecs describe-services --cluster nextn-cluster --services nextn-service
```

---

## Troubleshooting

### Error: "Cannot find module"
- Asegúrate de que `output: 'standalone'` esté en `next.config.ts`

### Error: "Port already in use"
- Cambia el puerto en `docker-compose.yml` o mata el proceso

### Error: "Build failed"
- Revisa que todas las variables de entorno estén configuradas
- Verifica que Firebase credentials sean válidas

---

## Estimación de Costos

### AWS Amplify:
- ~$15-30/mes para tráfico moderado
- Incluye CDN y SSL

### ECS Fargate:
- ~$25-50/mes para 2 containers
- Más ALB (~$20/mes)
- Total: ~$45-70/mes

---

## Recomendación

**Para desarrollo/testing**: Usa AWS Amplify
**Para producción enterprise**: Usa ECS Fargate

¿Preguntas? Revisa los archivos de configuración incluidos en el proyecto.