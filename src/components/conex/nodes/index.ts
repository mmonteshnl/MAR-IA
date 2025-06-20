// Importar nodos modulares (nueva estructura)
import { ApiCallNode } from './ApiCallNode';
import { DataTransformNode } from './DataTransformNode';
import { Component as HttpRequestNode } from './HttpRequestNode';
import { MonitorNode } from './MonitorNode';
import { TriggerNode } from './TriggerNode';
import { Component as LeadValidatorNode } from './LeadValidatorNode';
import { Component as LogicGateNode } from './LogicGate';
import { Component as DataFetcherNode } from './DataFetcher';
import { ConversationalAICallNode } from './ConversationalAICallNode';
import { SendEmailNode } from './SendEmailNode';

export const nodeTypes = {
  trigger: TriggerNode,
  apiCall: ApiCallNode,
  httpRequest: HttpRequestNode,
  dataTransform: DataTransformNode,
  monitor: MonitorNode,
  leadValidator: LeadValidatorNode,
  logicGate: LogicGateNode,
  dataFetcher: DataFetcherNode,
  conversationalAICall: ConversationalAICallNode,
  sendEmail: SendEmailNode,
};

export {
  TriggerNode,
  ApiCallNode,
  HttpRequestNode,
  DataTransformNode,
  MonitorNode,
  LeadValidatorNode,
  LogicGateNode,
  DataFetcherNode,
  ConversationalAICallNode,
  SendEmailNode,
};