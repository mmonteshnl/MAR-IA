// Importar nodos modulares (nueva estructura)
import { ApiCallNode } from './ApiCallNode';
import { DataTransformNode } from './DataTransformNode';
import { Component as HttpRequestNode } from './HttpRequestNode';
import { MonitorNode } from './MonitorNode';
import { TriggerNode } from './TriggerNode';

export const nodeTypes = {
  trigger: TriggerNode,
  apiCall: ApiCallNode,
  httpRequest: HttpRequestNode,
  dataTransform: DataTransformNode,
  monitor: MonitorNode,
};

export {
  TriggerNode,
  ApiCallNode,
  HttpRequestNode,
  DataTransformNode,
  MonitorNode,
};