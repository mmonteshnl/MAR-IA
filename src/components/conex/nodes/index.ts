import { TriggerNode } from './TriggerNode';
import { ApiCallNode } from './ApiCallNode';
import { HttpRequestNode } from './HttpRequestNode';
import { DataTransformNode } from './DataTransformNode';
import { MonitorNode } from './MonitorNode';

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