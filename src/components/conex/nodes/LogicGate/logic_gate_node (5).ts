// LogicGateNode/runner.ts
import { LogicGateNodeConfig } from './schema';

export interface LogicGateNodeContext {
  input: { a: boolean; b?: boolean };
  variables: Record<string, any>;
  stepData?: Record<string, any>;
}

export interface LogicGateNodeResult {
  success: boolean;
  data?: boolean;
  error?: string;
}

export async function runLogicGateNode(
  config: LogicGateNodeConfig,
  context: LogicGateNodeContext
): Promise<LogicGateNodeResult> {
  try {
    const { a, b } = context.input;
    let result: boolean;

    switch (config.gateType) {
      case 'AND':
        result = a && !!b;
        break;
      case 'OR':
        result = a || !!b;
        break;
      case 'NOT':
        result = !a;
        break;
      case 'NAND':
        result = !(a && !!b);
        break;
      case 'NOR':
        result = !(a || !!b);
        break;
      case 'XOR':
        result = a !== b;
        break;
      case 'XNOR':
        result = a === b;
        break;
      default:
        throw new Error(`Compuerta desconocida: ${config.gateType}`);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
