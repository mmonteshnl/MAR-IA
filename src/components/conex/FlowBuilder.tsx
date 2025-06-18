'use client';

import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { FlowBuilderCore } from './FlowBuilderCore';
import { FlowBuilderProps } from './types';

export function FlowBuilder(props: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderCore {...props} />
    </ReactFlowProvider>
  );
}