# Configuración del Módulo Conex

## Variables de Entorno Requeridas

### CONNECTIONS_ENCRYPTION_KEY
Esta variable es **crítica** para la seguridad del módulo Conex. Se usa para encriptar las credenciales de API almacenadas.

```bash
# Generar una nueva clave de 32 bytes
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Añadir al archivo .env.local
CONNECTIONS_ENCRYPTION_KEY=tu_clave_generada_aqui
```

## Instalación y Configuración

1. **Instalar dependencias** (ya completado):
   ```bash
   npm install react-flow handlebars
   ```

2. **Configurar variable de entorno**:
   ```bash
   # Crear/editar .env.local
   echo "CONNECTIONS_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env.local
   ```

3. **Configurar rutas de navegación** (si es necesario):
   - `/conex/connections` - Gestión de conexiones API
   - `/conex/flows` - Constructor de flujos visuales

## Archivos Creados

### Backend (APIs)
- `src/lib/secure-crypto.ts` - Utilidades de cifrado
- `src/lib/flow-executor.ts` - Motor de ejecución de flujos
- `src/app/api/connections/route.ts` - API CRUD de conexiones
- `src/app/api/flows/route.ts` - API CRUD de flujos
- `src/app/api/flows/run/[flowId]/route.ts` - Ejecución de flujos

### Frontend
- `src/app/conex/connections/page.tsx` - Página de conexiones
- `src/app/conex/flows/page.tsx` - Página de flujos
- `src/components/conex/FlowBuilder.tsx` - Constructor visual
- `src/hooks/useManualFlows.ts` - Hook para flujos manuales

### Tipos
- `src/types/conex.ts` - Definiciones TypeScript

### Integraciones
- `src/components/leads/AIActionsModal.tsx` - Integrado con flujos Conex

## Uso

### 1. Crear una Conexión
1. Ir a `/conex/connections`
2. Hacer clic en "New Connection"
3. Configurar tipo de autenticación y credenciales
4. Guardar (las credenciales se encriptan automáticamente)

### 2. Crear un Flujo
1. Ir a `/conex/flows`
2. Crear nuevo flujo con trigger "Manual (Lead Action)"
3. Usar el constructor visual para añadir nodos:
   - Trigger: Punto de entrada
   - API Call: Llamadas HTTP con templating
   - Data Transform: Transformación de datos

### 3. Ejecutar Flujos desde Leads
- Los flujos con trigger `manual_lead_action` aparecen automáticamente en el modal de "Acciones IA"
- Al ejecutar, se pasan datos del lead como input al flujo

## Migración del Caso PandaDoc

Para migrar `quote/generar_cotizacion.py`:

1. **Crear conexión PandaDoc**:
   - Tipo: "PandaDoc"
   - Auth: "API Key"
   - Valor: `b312bd6063d6a1b3d6b26a3459e64f3c27c0e39b`

2. **Crear flujo "Generar Cotización PandaDoc"**:
   - Trigger: Manual Lead Action
   - Nodo API Call:
     - URL: `https://api.pandadoc.com/public/v1/documents`
     - Method: POST
     - Headers: `{"Authorization": "API-Key {{connection.apiKey}}", "Content-Type": "application/json"}`
     - Body: JSON del documento usando variables `{{trigger.input.leadName}}`, etc.

3. **Eliminar archivos obsoletos**:
   ```bash
   rm quote/generar_cotizacion.py
   rm quote/generar_cotizacion_mensual.py
   rm quote/precios.json
   ```

## Seguridad

- Las credenciales se encriptan con AES-256-GCM
- Cada organización tiene acceso solo a sus conexiones y flujos
- La clave de encriptación debe mantenerse segura y no commitirse al repositorio
- Usar variables de entorno diferentes para cada entorno (dev, staging, prod)

## Escalabilidad Futura

- Para flujos largos, considerar implementar QStash o Inngest
- Los flujos se pueden extender con más tipos de nodos
- Posibilidad de añadir triggers por eventos o webhooks
- Dashboard de monitoreo de ejecuciones