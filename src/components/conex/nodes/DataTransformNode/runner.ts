import { DataTransformNodeConfig } from './schema';

export interface DataTransformNodeContext {
  input: any;
  variables: Record<string, any>;
  stepData: Record<string, any>;
}

export interface DataTransformNodeResult {
  success: boolean;
  data?: any;
  error?: string;
  transformationsApplied?: number;
}

export async function runDataTransformNode(
  config: DataTransformNodeConfig,
  context: DataTransformNodeContext
): Promise<DataTransformNodeResult> {
  try {
    const result: any = {};
    let transformationsApplied = 0;

    // Apply each transformation
    for (const transformation of config.transformations) {
      try {
        const sourceValue = getNestedValue(context, transformation.sourceField);
        let transformedValue: any;

        switch (transformation.transform) {
          case 'copy':
            transformedValue = sourceValue;
            break;

          case 'format':
            if (transformation.formatTemplate) {
              transformedValue = applyTemplate(transformation.formatTemplate, context);
            } else {
              transformedValue = sourceValue;
            }
            break;

          case 'map':
            if (transformation.mapping && sourceValue in transformation.mapping) {
              transformedValue = transformation.mapping[sourceValue];
            } else {
              transformedValue = sourceValue;
            }
            break;

          case 'extract':
            if (transformation.extractPath && sourceValue) {
              transformedValue = getNestedValue({ data: sourceValue }, `data.${transformation.extractPath}`);
            } else {
              transformedValue = sourceValue;
            }
            break;

          case 'combine':
            if (transformation.combineFields && transformation.combineTemplate) {
              const values: Record<string, any> = {};
              for (const field of transformation.combineFields) {
                values[field] = getNestedValue(context, field);
              }
              transformedValue = applyTemplate(transformation.combineTemplate, { ...context, combine: values });
            } else if (transformation.combineFields) {
              transformedValue = transformation.combineFields
                .map(field => getNestedValue(context, field))
                .filter(val => val !== undefined && val !== null)
                .join(' ');
            } else {
              transformedValue = sourceValue;
            }
            break;

          default:
            transformedValue = sourceValue;
        }

        // Set the transformed value in the result
        setNestedValue(result, transformation.targetField, transformedValue);
        transformationsApplied++;
      } catch (error) {
        console.warn(`Failed to apply transformation ${transformation.id}:`, error);
        // Continue with other transformations
      }
    }

    // Prepare final output
    let finalResult: any;
    if (config.preserveOriginal) {
      finalResult = {
        ...context,
        [config.outputName]: result,
      };
    } else {
      finalResult = {
        [config.outputName]: result,
      };
    }

    return {
      success: true,
      data: finalResult,
      transformationsApplied,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      transformationsApplied: 0,
    };
  }
}

function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

function applyTemplate(template: string, context: any): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(context, path.trim());
    return value !== undefined ? String(value) : match;
  });
}