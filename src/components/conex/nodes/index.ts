import { TriggerNode } from './TriggerNode';
import { ApiCallNode } from './ApiCallNode';
import { DataTransformNode } from './DataTransformNode';
import { MonitorNode } from './MonitorNode';

export const nodeTypes = {
  trigger: TriggerNode,
  apiCall: ApiCallNode,
  dataTransform: DataTransformNode,
  monitor: MonitorNode,
};

export {
  TriggerNode,
  ApiCallNode,
  DataTransformNode,
  MonitorNode,
};