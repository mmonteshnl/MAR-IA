import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MonitorNode } from './MonitorNode';
import { MonitorNodeData } from './schema';

// Mock de react-flow
jest.mock('reactflow', () => ({
  Handle: ({ children, ...props }: any) => <div data-testid="handle" {...props}>{children}</div>,
  Position: {
    Left: 'left',
    Right: 'right',
  },
}));

// Mock de lucide-react
jest.mock('lucide-react', () => ({
  Monitor: ({ ...props }: any) => <div data-testid="monitor-icon" {...props} />,
  Eye: ({ ...props }: any) => <div data-testid="eye-icon" {...props} />,
}));

// Mock de los componentes UI
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="button" {...props}>
      {children}
    </button>
  ),
}));

jest.mock('../../components/NodeHelpModal', () => ({
  NodeHelpModal: ({ title, description, usage, tips, examples, nodeType, ...props }: any) => 
    <div data-testid="help-modal" />,
}));

jest.mock('./MonitorDataModal', () => ({
  MonitorDataModal: ({ isOpen, onClose, data, formattedOutput, outputFormat, timestamp, ...props }: any) => 
    isOpen ? <div data-testid="data-modal" onClick={onClose} /> : null,
}));

const mockNodeData: MonitorNodeData = {
  config: {
    name: 'Test Monitor',
    displayFields: 'field1,field2',
    outputFormat: 'json' as const,
    enableTimestamp: true,
  },
};

describe('MonitorNode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders monitor node with default configuration', () => {
    render(<MonitorNode data={mockNodeData} />);
    
    expect(screen.getAllByText('Test Monitor')[0]).toBeInTheDocument();
    expect(screen.getByTestId('monitor-icon')).toBeInTheDocument();
    expect(screen.getByText('Mostrando: 2 campos')).toBeInTheDocument();
    expect(screen.getAllByText('json')[0]).toBeInTheDocument();
  });

  it('renders with minimal configuration', () => {
    const minimalData: MonitorNodeData = {
      config: {},
    };
    
    render(<MonitorNode data={minimalData} />);
    
    expect(screen.getAllByText('Debug Monitor')[0]).toBeInTheDocument();
    expect(screen.getAllByText('json')[0]).toBeInTheDocument();
  });

  it('shows status indicators correctly', () => {
    const loadingData: MonitorNodeData = {
      ...mockNodeData,
      meta: {
        status: 'loading',
      },
    };
    
    render(<MonitorNode data={loadingData} />);
    
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows success status indicator', () => {
    const successData: MonitorNodeData = {
      ...mockNodeData,
      meta: {
        status: 'success',
      },
    };
    
    render(<MonitorNode data={successData} />);
    
    expect(screen.getByTitle('Éxito')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('shows error status indicator', () => {
    const errorData: MonitorNodeData = {
      ...mockNodeData,
      meta: {
        status: 'error',
      },
    };
    
    render(<MonitorNode data={errorData} />);
    
    expect(screen.getByTitle('Error')).toBeInTheDocument();
    expect(screen.getByText('!')).toBeInTheDocument();
  });

  it('shows data button when data is available', () => {
    const dataAvailableData: MonitorNodeData = {
      ...mockNodeData,
      meta: {
        receivedData: { test: 'data' },
        formattedOutput: '{"test": "data"}',
      },
    };
    
    render(<MonitorNode data={dataAvailableData} />);
    
    expect(screen.getByText('Ver Datos')).toBeInTheDocument();
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
  });

  it('opens data modal when button is clicked', () => {
    const dataAvailableData: MonitorNodeData = {
      ...mockNodeData,
      meta: {
        receivedData: { test: 'data' },
        formattedOutput: '{"test": "data"}',
      },
    };
    
    render(<MonitorNode data={dataAvailableData} />);
    
    const dataButton = screen.getByText('Ver Datos');
    fireEvent.click(dataButton);
    
    expect(screen.getByTestId('data-modal')).toBeInTheDocument();
  });

  it('closes data modal when clicked', () => {
    const dataAvailableData: MonitorNodeData = {
      ...mockNodeData,
      meta: {
        receivedData: { test: 'data' },
        formattedOutput: '{"test": "data"}',
      },
    };
    
    render(<MonitorNode data={dataAvailableData} />);
    
    const dataButton = screen.getByText('Ver Datos');
    fireEvent.click(dataButton);
    
    const modal = screen.getByTestId('data-modal');
    fireEvent.click(modal);
    
    expect(screen.queryByTestId('data-modal')).not.toBeInTheDocument();
  });

  it('applies correct border color based on status', () => {
    const { rerender } = render(<MonitorNode data={mockNodeData} />);
    
    // Default status
    expect(document.querySelector('.border-cyan-500')).toBeInTheDocument();
    
    // Loading status
    rerender(<MonitorNode data={{
      ...mockNodeData,
      meta: { status: 'loading' },
    }} />);
    expect(document.querySelector('.border-blue-500')).toBeInTheDocument();
    
    // Success status
    rerender(<MonitorNode data={{
      ...mockNodeData,
      meta: { status: 'success' },
    }} />);
    expect(document.querySelector('.border-green-500')).toBeInTheDocument();
    
    // Error status
    rerender(<MonitorNode data={{
      ...mockNodeData,
      meta: { status: 'error' },
    }} />);
    expect(document.querySelector('.border-red-500')).toBeInTheDocument();
  });

  it('handles different output formats', () => {
    const tableData: MonitorNodeData = {
      config: {
        name: 'Table Monitor',
        outputFormat: 'table',
      },
    };
    
    render(<MonitorNode data={tableData} />);
    
    expect(screen.getAllByText('Table Monitor')[0]).toBeInTheDocument();
    expect(screen.getAllByText('table')[0]).toBeInTheDocument();
  });

  it('shows execution metadata in tooltip', () => {
    const metaData: MonitorNodeData = {
      ...mockNodeData,
      meta: {
        lastExecution: '2023-01-01T12:00:00Z',
        executionCount: 5,
        status: 'success',
      },
    };
    
    render(<MonitorNode data={metaData} />);
    
    // The tooltip content should be in the DOM but hidden
    expect(screen.getByText('Última ejecución:')).toBeInTheDocument();
    expect(screen.getByText('Ejecutado:')).toBeInTheDocument();
    expect(screen.getByText('5 veces')).toBeInTheDocument();
  });

  it('shows development status badge in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const devData: MonitorNodeData = {
      ...mockNodeData,
      meta: {
        status: 'success',
      },
    };
    
    render(<MonitorNode data={devData} />);
    
    expect(screen.getByText('success')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('renders react-flow handles correctly', () => {
    render(<MonitorNode data={mockNodeData} />);
    
    const handles = screen.getAllByTestId('handle');
    expect(handles).toHaveLength(2);
    
    // Check that we have both target and source handles
    expect(handles[0]).toHaveAttribute('type', 'target');
    expect(handles[1]).toHaveAttribute('type', 'source');
  });

  it('handles keyboard events on the node', () => {
    render(<MonitorNode data={mockNodeData} />);
    
    const nodeElement = screen.getByRole('button', { name: 'Nodo Monitor de Debug' });
    expect(nodeElement).toBeInTheDocument();
    
    // Test keyboard navigation
    fireEvent.keyDown(nodeElement, { key: 'Enter' });
    fireEvent.keyDown(nodeElement, { key: ' ' });
    
    // Should not crash
    expect(nodeElement).toBeInTheDocument();
  });

  it('renders help modal component', () => {
    render(<MonitorNode data={mockNodeData} />);
    
    expect(screen.getByTestId('help-modal')).toBeInTheDocument();
  });

  it('displays correct field count when displayFields is configured', () => {
    const multiFieldData: MonitorNodeData = {
      config: {
        name: 'Multi Field Monitor',
        displayFields: 'field1,field2,field3,field4',
      },
    };
    
    render(<MonitorNode data={multiFieldData} />);
    
    expect(screen.getByText('Mostrando: 4 campos')).toBeInTheDocument();
  });

  it('handles empty displayFields gracefully', () => {
    const emptyFieldsData: MonitorNodeData = {
      config: {
        name: 'Empty Fields Monitor',
        displayFields: '',
      },
    };
    
    render(<MonitorNode data={emptyFieldsData} />);
    
    // Should not crash and should render the monitor name
    expect(screen.getAllByText('Empty Fields Monitor')[0]).toBeInTheDocument();
  });
});