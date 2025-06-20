// Exports para el nodo ConversationalAICall
export { ConversationalAICallNode } from './ConversationalAICallNode';
export { ConversationalAICallNodeSettings } from './ConversationalAICallNodeSettings';
export { runConversationalAICallNode, validateConversationalAICallNodeConfig } from './runner';
export { 
  conversationalAICallNodeSchema, 
  conversationalAICallNodeDataSchema,
  CONVERSATIONAL_AI_CALL_DEFAULTS,
  type ConversationalAICallNodeConfig,
  type ConversationalAICallNodeData,
  type ConversationalAICallResult,
} from './schema';
export { CONVERSATIONAL_AI_CALL_NODE, HELP_CONTENT } from './constants';