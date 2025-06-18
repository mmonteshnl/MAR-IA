// src/components/conex/nodes/HttpRequestNode.tsx
import React, { useMemo, lazy, Suspense, KeyboardEvent } from 'react';
import { Handle, Position } from 'reactflow';
import { Globe } from 'lucide-react';
import { z } from 'zod';
import { NodeHelpModal } from '../components/NodeHelpModal';


const HttpRequestConfigSchema = z.object({
  name: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
  timeout: z.number().optional(),
  retries: z.number().optional(),
});
type HttpRequestConfig = z.infer<typeof HttpRequestConfigSchema>;

interface HttpRequestNodeProps {
  data: {
    config: unknown;
    meta?: {
      status?: 'idle' | 'loading' | 'success' | 'error';
    };
  };
}

function Spinner() {
  return (
    <div
      className="animate-spin rounded-full border-2 border-white border-t-transparent w-3 h-3"
      aria-hidden="true"
    />
  );
}

function HttpRequestNodeController({ data }: HttpRequestNodeProps) {
  const parse = HttpRequestConfigSchema.safeParse(data.config);
  if (!parse.success) {
    return (
      <div className="px-4 py-2 rounded-md bg-gray-900 border-2 border-red-500 text-white text-sm">
        Error en configuración
      </div>
    );
  }
  return <HttpRequestNodeView config={parse.data} meta={data.meta} />;
}

interface HttpRequestNodeViewProps {
  config: HttpRequestConfig;
  meta?: {
    status?: 'idle' | 'loading' | 'success' | 'error';
  };
}

const HttpRequestNodeView = React.memo(function HttpRequestNodeView({
  config,
  meta,
}: HttpRequestNodeViewProps) {
  const getMethodColor = (m: string) => {
    const map: Record<string, string> = {
      GET: 'text-green-400',
      POST: 'text-blue-400',
      PUT: 'text-yellow-400',
      DELETE: 'text-red-400',
      PATCH: 'text-purple-400',
    };
    return map[m.toUpperCase()] || 'text-gray-400';
  };

  const helpContent = useMemo(
    () => ({
      nodeType: 'httpRequest',
      title: 'Nodo HTTP Avanzado',
      description:
        'Realiza peticiones HTTP avanzadas con REST APIs, autenticación, retries y manejo de errores.',
      usage: [
        'Soporta GET, POST, PUT, DELETE, PATCH',
        'Headers personalizados y autenticación',
        'Manejo de JSON, XML y texto plano',
        'Timeout configurable y reintentos automáticos',
        'Transformación de respuestas',
      ],
      examples: [
        `// API GitHub – Listar repos
URL: https://api.github.com/user/repos
Método: GET
Headers: {
  "Authorization": "Bearer {{connections.github.token}}",
  "Accept": "application/vnd.github.v3+json"
}
Timeout: 30s
Reintentos: 2`,
        `// Webhook Slack
URL: https://hooks.slack.com/services/{{config.webhookPath}}
Método: POST
Body: {
  "text": "Lead {{trigger.input.leadName}} calificado",
  "attachments": [{
    "color": "good",
    "fields": [
      {"title": "Email", "value": "{{trigger.input.leadEmail}}"},
      {"title": "Valor", "value": "{{trigger.input.leadValue}}"}
    ]
  }]
}
Timeout: 15s`,
      ],
      tips: [
        'Usa timeout para APIs lentas (máx 60s)',
        'Configura reintentos para endpoints inestables',
        'Incluye Accept y Content-Type adecuados',
        'Emplea variables dinámicas en payloads',
        'Captura y muestra errores con MonitorNode',
      ],
    }),
    []
  );

  const status = meta?.status;
  const isLoading = status === 'loading';
  const isError = status === 'error';
  const isSuccess = status === 'success';

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // TODO: abrir modal de ayuda
    }
  };

  return (
    <div
      className={`group relative px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-purple-500 min-w-[140px] ${
        isLoading ? 'opacity-60' : ''
      }`}
      role="button"
      aria-label="Nodo HTTP Avanzado"
      tabIndex={0}
      style={{ color: 'white' }}
      onKeyDown={onKeyDown}
    >
      <Handle
        type="target"
        position={Position.Left}
        aria-label="Entrada HTTP"
      />
      <Handle
        type="source"
        position={Position.Right}
        aria-label="Salida HTTP"
      />

      <Suspense fallback={null}>
        <NodeHelpModal {...helpContent} />
      </Suspense>

      {isLoading && (
        <div className="absolute top-1 right-1">
          <Spinner />
        </div>
      )}
      {isError && (
        <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1">
          !
        </span>
      )}
      {isSuccess && (
        <span className="absolute top-1 right-1 bg-green-500 text-white text-xs rounded-full px-1">
          ✓
        </span>
      )}

      <div className="flex items-center">
        <Globe className="h-4 w-4 mr-2 text-purple-400" aria-hidden="true" />
        <div className="text-sm font-semibold">
          {config.name || 'HTTP Request'}
        </div>
      </div>

      <div className="flex items-center justify-between mt-1">
        {config.method && (
          <div
            className={`text-xs uppercase font-mono font-bold ${getMethodColor(
              config.method
            )}`}
          >
            {config.method}
          </div>
        )}
        {config.timeout != null && (
          <div className="text-xs text-gray-400">{config.timeout}s</div>
        )}
        {config.retries != null && (
          <div className="text-xs text-gray-400">↻ {config.retries}</div>
        )}
      </div>

      {config.url && (
        <div
          className="text-xs mt-1 text-gray-300 truncate max-w-[120px]"
          title={config.url}
        >
          {config.url}
        </div>
      )}
    </div>
  );
});

export const HttpRequestNode = React.memo(HttpRequestNodeController);
