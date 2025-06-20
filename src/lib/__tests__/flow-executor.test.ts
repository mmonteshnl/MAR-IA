import { FlowExecutor } from '../flow-executor';
// TODO: Replace with the correct import if FlowContext is exported under a different name
// import type { FlowContext } from '@/types/conex';
type FlowContext = {
  executionId: string;
  organizationId: string;
  userId: string;
  flowId: string;
  input: any;
  variables: Record<string, any>;
  connections: Record<string, any>;
  nodeOutputs: Record<string, any>;
  metadata: {
    startTime: string;
    currentNode: string | null;
    totalNodes: number;
  };
};

// Mock dependencies
jest.mock('handlebars', () => ({
  compile: jest.fn().mockReturnValue(jest.fn().mockReturnValue('rendered-template')),
  registerHelper: jest.fn()
}));

jest.mock('@/lib/secure-crypto', () => ({
  __esModule: true,
  decryptApiKey: jest.fn().mockReturnValue('decrypted-key'),
  encryptApiKey: jest.fn().mockReturnValue('encrypted-key'),
  decrypt: jest.fn().mockReturnValue('{"apiKey": "decrypted-key"}'),
  encrypt: jest.fn().mockReturnValue('encrypted-key')
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        set: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: jest.fn().mockReturnValue({
            status: 'pending',
            context: {},
            currentNodeIndex: 0
          })
        }),
        update: jest.fn().mockResolvedValue(undefined)
      })
    })
  })
}));

// Mock fetch for HTTP requests
global.fetch = jest.fn();

describe('FlowExecutor', () => {
  let executor: FlowExecutor;
  let mockFlowData: FlowData;
  let mockContext: FlowContext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock flow data
    mockFlowData = {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 0, y: 0 },
          data: {
            label: 'Manual Trigger',
            config: { triggerType: 'manual' }
          }
        },
        {
          id: 'api-1',
          type: 'apiCall',
          position: { x: 200, y: 0 },
          data: {
            label: 'API Call',
            config: {
              method: 'POST',
              url: 'https://api.example.com/webhook',
              headers: { 'Content-Type': 'application/json' },
              body: '{"message": "{{context.message}}"}'
            }
          }
        }
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'trigger-1',
          target: 'api-1',
          type: 'default'
        }
      ]
    };

    mockContext = {
      executionId: 'exec_123',
      organizationId: 'org_123',
      userId: 'user_123',
      flowId: 'flow_123',
      input: { message: 'Hello World' },
      variables: {},
      connections: {},
      nodeOutputs: {},
      metadata: {
        startTime: new Date().toISOString(),
        currentNode: null,
        totalNodes: 2
      }
    };

    executor = new FlowExecutor();
  });

  describe('Context Initialization', () => {
    it('should initialize context with basic flow data', async () => {
      await executor.initializeContext(
        { message: 'test' },
        []
      );

      expect(executor['context']).toMatchObject({
        variables: {
          trigger: {
            input: { message: 'test' }
          }
        },
        connections: {},
        stepResults: {},
        status: 'running'
      });

      expect(executor['context'].executionId).toMatch(/^exec_/);
    });

    it('should decrypt connection credentials', async () => {
      const connections = [
        { id: 'elevenlabs', credentials: 'encrypted-key', type: 'api' }
      ];

      await executor.initializeContext(
        {},
        connections
      );

      expect(executor['context'].connections).toEqual({
        'elevenlabs': { apiKey: 'decrypted-key' }
      });
    });

    it('should handle missing connections gracefully', async () => {
      await executor.initializeContext(
        {},
        []
      );

      expect(executor['context'].connections).toEqual({});
    });
  });

  describe('Flow Execution Order', () => {
    it('should determine correct execution order for simple flow', () => {
      const result = executor.getExecutionOrder(mockFlowData);

      expect(result).toEqual(['trigger-1', 'api-1']);
    });

    it('should handle complex branching flows', () => {
      const complexFlow: FlowData = {
        nodes: [
          { id: 'trigger', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Start' } },
          { id: 'logic', type: 'logicGate', position: { x: 200, y: 0 }, data: { label: 'Decision' } },
          { id: 'action-a', type: 'apiCall', position: { x: 400, y: -100 }, data: { label: 'Action A' } },
          { id: 'action-b', type: 'apiCall', position: { x: 400, y: 100 }, data: { label: 'Action B' } },
          { id: 'final', type: 'monitor', position: { x: 600, y: 0 }, data: { label: 'Final' } }
        ],
        edges: [
          { id: 'e1', source: 'trigger', target: 'logic', type: 'default' },
          { id: 'e2', source: 'logic', target: 'action-a', type: 'conditional', sourceHandle: 'true' },
          { id: 'e3', source: 'logic', target: 'action-b', type: 'conditional', sourceHandle: 'false' },
          { id: 'e4', source: 'action-a', target: 'final', type: 'default' },
          { id: 'e5', source: 'action-b', target: 'final', type: 'default' }
        ]
      };

      const result = executor.getExecutionOrder(complexFlow);

      expect(result[0]).toBe('trigger');
      expect(result[1]).toBe('logic');
      expect(result).toContain('action-a');
      expect(result).toContain('action-b');
      expect(result[result.length - 1]).toBe('final');
    });

    it('should detect circular dependencies', () => {
      const circularFlow: FlowData = {
        nodes: [
          { id: 'a', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'A' } },
          { id: 'b', type: 'apiCall', position: { x: 200, y: 0 }, data: { label: 'B' } },
          { id: 'c', type: 'monitor', position: { x: 400, y: 0 }, data: { label: 'C' } }
        ],
        edges: [
          { id: 'e1', source: 'a', target: 'b', type: 'default' },
          { id: 'e2', source: 'b', target: 'c', type: 'default' },
          { id: 'e3', source: 'c', target: 'a', type: 'default' } // Creates cycle
        ]
      };

      expect(() => executor.getExecutionOrder(circularFlow)).toThrow('Circular dependency detected');
    });
  });

  describe('Template Rendering', () => {
    it('should render simple templates with context variables', () => {
      const template = 'Hello {{name}}, your order {{orderId}} is ready!';
      const context = { name: 'John', orderId: '12345' };

      const result = executor.renderTemplate(template, context);

      expect(result).toBe('rendered-template');
    });

    it('should handle nested object access in templates', () => {
      const template = 'User: {{user.name}}, Email: {{user.contact.email}}';
      const context = {
        user: {
          name: 'Jane',
          contact: { email: 'jane@example.com' }
        }
      };

      const result = executor.renderTemplate(template, context);

      expect(result).toBe('rendered-template');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{nonexistent.variable}}';
      const context = {};

      const result = executor.renderTemplate(template, context);

      expect(result).toBe('rendered-template');
    });
  });

  describe('Variable Path Resolution', () => {
    it('should resolve simple variable paths', () => {
      const context = { userName: 'John', age: 30 };
      
      expect(executor.resolveVariablePath('userName', context)).toBe('John');
      expect(executor.resolveVariablePath('age', context)).toBe(30);
    });

    it('should resolve nested variable paths', () => {
      const context = {
        user: {
          profile: {
            name: 'Jane',
            settings: { theme: 'dark' }
          }
        }
      };

      expect(executor.resolveVariablePath('user.profile.name', context)).toBe('Jane');
      expect(executor.resolveVariablePath('user.profile.settings.theme', context)).toBe('dark');
    });

    it('should return undefined for missing paths', () => {
      const context = { user: { name: 'John' } };

      expect(executor.resolveVariablePath('user.nonexistent', context)).toBeUndefined();
      expect(executor.resolveVariablePath('missing.path', context)).toBeUndefined();
    });

    it('should handle array access', () => {
      const context = {
        users: [
          { name: 'John' },
          { name: 'Jane' }
        ]
      };

      expect(executor.resolveVariablePath('users.0.name', context)).toBe('John');
      expect(executor.resolveVariablePath('users.1.name', context)).toBe('Jane');
    });
  });

  describe('Data Mapping', () => {
    it('should apply simple field mappings', () => {
      const sourceData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      const mapping = {
        'name': 'firstName',
        'surname': 'lastName',
        'contactEmail': 'email'
      };

      const result = executor.applyMapping(sourceData, mapping);

      expect(result).toEqual({
        name: 'John',
        surname: 'Doe',
        contactEmail: 'john@example.com'
      });
    });

    it('should handle nested source mappings', () => {
      const sourceData = {
        user: {
          personal: {
            name: 'Jane',
            age: 25
          },
          contact: {
            email: 'jane@example.com'
          }
        }
      };

      const mapping = {
        'fullName': 'user.personal.name',
        'userAge': 'user.personal.age',
        'primaryEmail': 'user.contact.email'
      };

      const result = executor.applyMapping(sourceData, mapping);

      expect(result).toEqual({
        fullName: 'Jane',
        userAge: 25,
        primaryEmail: 'jane@example.com'
      });
    });

    it('should handle missing source fields', () => {
      const sourceData = { name: 'John' };
      const mapping = {
        'userName': 'name',
        'userEmail': 'email' // Missing field
      };

      const result = executor.applyMapping(sourceData, mapping);

      expect(result).toEqual({
        userName: 'John',
        userEmail: undefined
      });
    });
  });

  describe('Authentication Headers', () => {
    it('should generate Bearer token headers', () => {
      const connection = { apiKey: 'secret-token' };
      const authConfig = { type: 'bearer', key: 'apiKey' };

      const result = executor.getAuthHeaders(connection, authConfig);

      expect(result).toEqual({
        'Authorization': 'Bearer secret-token'
      });
    });

    it('should generate API key headers', () => {
      const connection = { apiKey: 'api-secret' };
      const authConfig = { type: 'apiKey', key: 'apiKey', header: 'X-API-Key' };

      const result = executor.getAuthHeaders(connection, authConfig);

      expect(result).toEqual({
        'X-API-Key': 'api-secret'
      });
    });

    it('should handle missing authentication config', () => {
      const connection = { apiKey: 'secret' };
      const authConfig = null;

      const result = executor.getAuthHeaders(connection, authConfig);

      expect(result).toEqual({});
    });

    it('should handle missing connection data', () => {
      const connection = {};
      const authConfig = { type: 'bearer', key: 'apiKey' };

      const result = executor.getAuthHeaders(connection, authConfig);

      expect(result).toEqual({});
    });
  });

  describe('Flow Execution', () => {
    it('should execute a simple flow successfully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, id: 'webhook_123' })
      } as Response);

      // Mock dynamic import for node runners
      jest.doMock('@/components/conex/nodes/TriggerNode/runner', () => ({
        default: jest.fn().mockResolvedValue({
          success: true,
          output: { triggered: true }
        })
      }), { virtual: true });

      jest.doMock('@/components/conex/nodes/ApiCallNode/runner', () => ({
        default: jest.fn().mockResolvedValue({
          success: true,
          output: { response: { success: true, id: 'webhook_123' } }
        })
      }), { virtual: true });

      const result = await executor.executeFlow(mockFlowData, mockContext);

      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context?.nodeOutputs).toHaveProperty('trigger-1');
      expect(result.context?.nodeOutputs).toHaveProperty('api-1');
    });

    it('should handle node execution failures', async () => {
      // Mock a failing node runner
      jest.doMock('@/components/conex/nodes/TriggerNode/runner', () => ({
        default: jest.fn().mockResolvedValue({
          success: false,
          error: 'Trigger failed to execute'
        })
      }), { virtual: true });

      const result = await executor.executeFlow(mockFlowData, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Trigger failed to execute');
    });

    it('should persist execution state to Firestore', async () => {
      const mockFirestore = require('firebase-admin/firestore').getFirestore();
      
      jest.doMock('@/components/conex/nodes/TriggerNode/runner', () => ({
        default: jest.fn().mockResolvedValue({
          success: true,
          output: { triggered: true }
        })
      }), { virtual: true });

      await executor.executeFlow(mockFlowData, mockContext);

      expect(mockFirestore.collection).toHaveBeenCalledWith('flow-executions');
      expect(mockFirestore.collection().doc().set).toHaveBeenCalled();
    });
  });

  describe('Execution State Management', () => {
    it('should load execution state from Firestore', async () => {
      const executionId = 'exec_123';
      
      const state = await FlowExecutor.loadExecutionState(executionId);

      expect(state).toEqual({
        status: 'pending',
        context: {},
        currentNodeIndex: 0
      });
    });

    it('should handle missing execution state', async () => {
      const mockFirestore = require('firebase-admin/firestore').getFirestore();
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: false
      });

      const state = await FlowExecutor.loadExecutionState('nonexistent');

      expect(state).toBeNull();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed flow data', async () => {
      const malformedFlow = {
        nodes: null,
        edges: []
      };

      const result = await executor.executeFlow(malformedFlow as any, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network failures gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      jest.doMock('@/components/conex/nodes/ApiCallNode/runner', () => ({
        default: jest.fn().mockRejectedValue(new Error('Network error'))
      }), { virtual: true });

      const result = await executor.executeFlow(mockFlowData, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should timeout long-running executions', async () => {
      jest.doMock('@/components/conex/nodes/TriggerNode/runner', () => ({
        default: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 10000))
        )
      }), { virtual: true });

      // Set a shorter timeout for testing
      const originalTimeout = executor.executionTimeout;
      executor.executionTimeout = 1000; // 1 second

      const result = await executor.executeFlow(mockFlowData, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');

      // Restore original timeout
      executor.executionTimeout = originalTimeout;
    });

    it('should validate context before execution', async () => {
      const invalidContext = {} as FlowContext; // Missing required fields

      const result = await executor.executeFlow(mockFlowData, invalidContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});