# Node Generation Blueprint - AI System Specification

**CRITICAL**: This document defines the EXACT technical specifications for automated node generation. All generated nodes MUST be 100% compatible with the existing FlowBuilder system.

## 🎯 MANDATORY FILE STRUCTURE

Every generated node MUST follow this EXACT structure:

```
{NODE_NAME}/
├── index.ts                         # REQUIRED: Export definitions
├── {NODE_NAME}.tsx                 # REQUIRED: ReactFlow UI component
├── {NODE_NAME}Settings.tsx         # REQUIRED: Configuration panel
├── runner.ts                       # REQUIRED: Pure execution logic
├── schema.ts                       # REQUIRED: Zod schemas + TypeScript types
├── constants.ts                    # REQUIRED: Defaults + metadata
└── BluePrint-Node-{TYPE_NAME}.md   # REQUIRED: Node technical specification
```

## 📋 TECHNICAL SPECIFICATIONS

### 1. NAMING CONVENTIONS (STRICT)

```typescript
// INPUT: Node concept/name
// OUTPUT: All naming variants

PATTERN_NODE_NAME: PascalCase + "Node" suffix
// Example: "DatabaseQueryNode", "EmailSenderNode"

PATTERN_DISPLAY_NAME: Human readable string
// Example: "Database Query", "Email Sender"

PATTERN_TYPE_NAME: Remove "Node" from NODE_NAME
// Example: "DatabaseQuery", "EmailSender"

PATTERN_CAMEL_CASE: First letter lowercase of TYPE_NAME
// Example: "databaseQuery", "emailSender"

PATTERN_KEBAB_CASE: Hyphen-separated lowercase
// Example: "database-query", "email-sender"

PATTERN_SNAKE_CASE: Underscore-separated uppercase
// Example: "DATABASE_QUERY", "EMAIL_SENDER"
```

### 2. SCHEMA.TS TEMPLATE (MANDATORY)

```typescript
import { z } from 'zod';

// CONFIG SCHEMA - Always required
export const {NODE_NAME}ConfigSchema = z.object({
  name: z.string().default('{DISPLAY_NAME}'),
  // Add specific config fields here based on node functionality
  // MUST include .describe() for each field
  // MUST include .default() for optional fields
});

// DATA SCHEMA - Always required
export const {NODE_NAME}DataSchema = z.object({
  config: {NODE_NAME}ConfigSchema,
  meta: z.object({
    status: z.enum(['idle', 'loading', 'success', 'error']).optional(),
    lastExecution: z.string().optional(),
    executionCount: z.number().optional(),
    lastResult: z.any().optional(),
    lastError: z.string().optional(),
    // Add node-specific meta fields here
  }).optional(),
});

// TYPE EXPORTS - Always required
export type {NODE_NAME}Config = z.infer<typeof {NODE_NAME}ConfigSchema>;
export type {NODE_NAME}Data = z.infer<typeof {NODE_NAME}DataSchema>;
```

### 3. CONSTANTS.TS TEMPLATE (MANDATORY)

```typescript
import { {NODE_NAME}Config } from './schema';

// DEFAULT CONFIG - Always required
export const {SNAKE_CASE}_DEFAULTS: {NODE_NAME}Config = {
  name: '{DISPLAY_NAME}',
  // Include all required config defaults
};

// HELP CONTENT - Always required (Spanish)
export const HELP_CONTENT = {
  nodeType: '{KEBAB_CASE}',
  title: '{DISPLAY_NAME}',
  description: '{DETAILED_DESCRIPTION_IN_SPANISH}',
  usage: [
    // Array of usage points in Spanish
  ],
  examples: [
    // Array of code examples as strings
  ],
  tips: [
    // Array of usage tips in Spanish
  ]
};

// Additional constants specific to node functionality
// Color schemes, validation rules, common configurations, etc.
```

### 4. RUNNER.TS TEMPLATE (MANDATORY)

```typescript
import { {NODE_NAME}Config } from './schema';

// CONTEXT INTERFACE - Always required
export interface {NODE_NAME}Context {
  input: any;
  variables: Record<string, any>;
  stepData?: Record<string, any>;
  // Add context fields specific to node
}

// RESULT INTERFACE - Always required
export interface {NODE_NAME}Result {
  success: boolean;
  data?: any;
  error?: string;
  // Add result fields specific to node
}

// MAIN EXECUTION FUNCTION - Always required
export async function run{NODE_NAME}(
  config: {NODE_NAME}Config,
  context: {NODE_NAME}Context
): Promise<{NODE_NAME}Result> {
  try {
    // Input validation
    // Core logic implementation
    // Error handling
    // Return success result
    
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

// Helper functions as needed
```

### 5. UI COMPONENT TEMPLATE (MANDATORY)

```typescript
import React from 'react';
import { Handle, Position } from 'reactflow';
import { {ICON_NAME} } from 'lucide-react';
import { NodeHelpModal } from '../../components/NodeHelpModal';
import { {NODE_NAME}Data } from './schema';
import { HELP_CONTENT } from './constants';

interface {NODE_NAME}Props {
  data: {NODE_NAME}Data;
}

export function {NODE_NAME}({ data }: {NODE_NAME}Props) {
  return (
    <div className="group relative px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 {BORDER_COLOR} min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      <NodeHelpModal {...HELP_CONTENT} />
      
      <div className="flex items-center">
        <{ICON_NAME} className="h-4 w-4 mr-2 {ICON_COLOR}" />
        <div className="text-sm font-semibold" style={{ color: 'white' }}>
          {data.config?.name || '{DISPLAY_NAME}'}
        </div>
      </div>
      
      {/* Node-specific status/info display */}
    </div>
  );
}
```

### 6. SETTINGS COMPONENT TEMPLATE (MANDATORY)

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { {NODE_NAME}Config, {NODE_NAME}ConfigSchema } from './schema';

interface {NODE_NAME}SettingsProps {
  config: {NODE_NAME}Config;
  onChange: (config: {NODE_NAME}Config) => void;
}

export function {NODE_NAME}Settings({ config, onChange }: {NODE_NAME}SettingsProps) {
  const updateConfig = (updates: Partial<{NODE_NAME}Config>) => {
    const newConfig = { ...config, ...updates };
    
    const validation = {NODE_NAME}ConfigSchema.safeParse(newConfig);
    if (validation.success) {
      onChange(validation.data);
    } else {
      toast({
        title: 'Error de Configuración',
        description: validation.error.errors[0]?.message || 'Configuración inválida',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-200">Configuración Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-300 text-xs">Nombre del Nodo</Label>
            <Input
              value={config.name}
              onChange={(e) => updateConfig({ name: e.target.value })}
              placeholder="{DISPLAY_NAME}"
              className="bg-gray-700 border-gray-600 text-gray-100"
            />
          </div>
          
          {/* Node-specific configuration fields */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 7. INDEX.TS TEMPLATE (MANDATORY)

```typescript
export { {NODE_NAME} } from './{NODE_NAME}';
export { {NODE_NAME}Settings } from './{NODE_NAME}Settings';
export { run{NODE_NAME} } from './runner';
export { 
  {NODE_NAME}Config, 
  {NODE_NAME}Data, 
  {NODE_NAME}ConfigSchema, 
  {NODE_NAME}DataSchema 
} from './schema';
export { {SNAKE_CASE}_DEFAULTS, HELP_CONTENT } from './constants';
```

### 8. BLUEPRINT-NODE-{TYPE_NAME}.MD TEMPLATE (MANDATORY)

File name: `BluePrint-Node-{TYPE_NAME}.md`

```markdown
# {NODE_NAME} - Technical Specification

**Node Type**: `{KEBAB_CASE}`  
**Category**: `{CATEGORY}`  
**Version**: `1.0.0`  
**Compatibility**: FlowBuilder v2.x

## 📋 Node Overview

{DETAILED_DESCRIPTION_IN_SPANISH}

### Primary Function
{PRIMARY_FUNCTION_DESCRIPTION}

### Input/Output Schema
- **Input**: {INPUT_DESCRIPTION}
- **Output**: {OUTPUT_DESCRIPTION}

## ⚙️ Configuration Schema

### Required Fields
```typescript
{REQUIRED_CONFIG_FIELDS}
```

### Optional Fields
```typescript
{OPTIONAL_CONFIG_FIELDS}
```

### Default Configuration
```typescript
{DEFAULT_CONFIG_OBJECT}
```

## 🎯 Características Técnicas

- ✅ {TECHNICAL_FEATURE_1}
- ✅ {TECHNICAL_FEATURE_2}
- ✅ {TECHNICAL_FEATURE_3}
- ✅ Variable interpolation support
- ✅ Error boundary protection
- ✅ TypeScript strict mode compatible

## 🔧 Configuration Sections

### {CONFIG_SECTION_1}
**Purpose**: {CONFIG_PURPOSE}  
**Fields**: {CONFIG_FIELDS}  
**Validation**: {VALIDATION_RULES}

### {CONFIG_SECTION_2}
**Purpose**: {CONFIG_PURPOSE}  
**Fields**: {CONFIG_FIELDS}  
**Validation**: {VALIDATION_RULES}

## 📖 Implementation Examples

### Basic Usage
```typescript
{BASIC_USAGE_EXAMPLE}
```

### Advanced Configuration
```typescript
{ADVANCED_CONFIG_EXAMPLE}
```

### Error Handling
```typescript
{ERROR_HANDLING_EXAMPLE}
```

## 📤 Output Format

### Success Response
```typescript
{
  success: true,
  data: {
    {SUCCESS_OUTPUT_STRUCTURE}
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: "Error message description"
}
```

## 🔗 Integration Points

### Required Dependencies
- {DEPENDENCY_1}
- {DEPENDENCY_2}

### Optional Dependencies
- {OPTIONAL_DEPENDENCY_1}

### External APIs
- {EXTERNAL_API_1}: {API_DESCRIPTION}

## 🧪 Testing Specifications

### Unit Tests Required
- [ ] Schema validation
- [ ] Runner function execution
- [ ] Error handling scenarios
- [ ] Configuration edge cases

### Integration Tests Required  
- [ ] UI component rendering
- [ ] Settings panel functionality
- [ ] Flow execution compatibility
- [ ] Variable interpolation

## 🚨 Known Limitations

- {LIMITATION_1}
- {LIMITATION_2}

## 📚 Related Nodes

- **{RELATED_NODE_1}**: {RELATIONSHIP_DESCRIPTION}
- **{RELATED_NODE_2}**: {RELATIONSHIP_DESCRIPTION}

---
*Generated by FlowBuilder AI System - Version {GENERATION_VERSION}*
```

## 🎨 VISUAL SPECIFICATIONS

### COLOR SCHEMES (STRICT)
```typescript
const COLOR_SCHEMES = {
  blue: { border: 'border-blue-500', text: 'text-blue-400' },
  green: { border: 'border-green-500', text: 'text-green-400' },
  purple: { border: 'border-purple-500', text: 'text-purple-400' },
  red: { border: 'border-red-500', text: 'text-red-400' },
  yellow: { border: 'border-yellow-500', text: 'text-yellow-400' },
  orange: { border: 'border-orange-500', text: 'text-orange-400' },
  pink: { border: 'border-pink-500', text: 'text-pink-400' },
  teal: { border: 'border-teal-500', text: 'text-teal-400' },
  indigo: { border: 'border-indigo-500', text: 'text-indigo-400' },
  gray: { border: 'border-gray-500', text: 'text-gray-400' },
};
```

### CATEGORY MAPPINGS (STRICT)
```typescript
const CATEGORY_COLORS = {
  api: 'blue',        // HTTP, REST, GraphQL
  database: 'green',  // SQL, NoSQL, Queries
  transform: 'purple', // Data manipulation
  ai: 'pink',         // LLM, AI services
  messaging: 'orange', // Email, SMS, Slack
  utility: 'gray',    // Logging, monitoring
  trigger: 'yellow',  // Events, webhooks
  workflow: 'indigo', // Flow control
  storage: 'teal',    // Files, cloud storage
  validation: 'red',  // Data validation, checks
};
```

## 🔧 INTEGRATION REQUIREMENTS

### 1. MAIN NODE REGISTRY UPDATE
After generation, MUST update `src/components/conex/nodes/index.ts`:

```typescript
// Add import
import { {NODE_NAME} } from './{NODE_NAME}';

// Add to nodeTypes
export const nodeTypes = {
  // existing nodes...
  {KEBAB_CASE}: {NODE_NAME},
};

// Add to exports
export {
  // existing exports...
  {NODE_NAME},
};
```

### 2. FLOW EXECUTOR UPDATE (IF NEEDED)
If node requires special execution logic, update `src/lib/flow-executor.ts`

### 3. VALIDATION RULES (STRICT)

```typescript
// Every generated node MUST pass these validations:

1. All files exist and follow naming convention
2. All imports resolve correctly
3. Zod schemas validate successfully
4. TypeScript compilation passes
5. UI component renders without errors
6. Settings component handles config changes
7. Runner function returns correct result interface
8. Constants export required HELP_CONTENT
9. BluePrint-Node-{TYPE_NAME}.md follows exact template structure
10. Integration with main system works
```

## 🚨 CRITICAL CONSTRAINTS

### ABSOLUTE REQUIREMENTS:
1. **NO BREAKING CHANGES** to existing system
2. **100% TypeScript** - no JavaScript files
3. **Zod validation** for all config schemas
4. **Error boundaries** in all components
5. **Spanish language** for all user-facing text
6. **Consistent styling** with existing nodes
7. **Handle positioning** - Left: input, Right: output
8. **Status indicators** - loading, success, error states
9. **Variable interpolation** support in configs
10. **Async/await** patterns in runners

### FORBIDDEN PATTERNS:
- ❌ Direct DOM manipulation
- ❌ Global state mutations
- ❌ Synchronous operations for I/O
- ❌ Hardcoded strings without constants
- ❌ Missing error handling
- ❌ Non-validated configurations
- ❌ Mixed language text (Spanish/English)
- ❌ Breaking TypeScript strict mode
- ❌ Missing accessibility attributes
- ❌ Inconsistent file naming

## 🎯 GENERATION ALGORITHM

```
INPUT: {
  nodeName: string,
  displayName: string,
  category: string,
  icon: string,
  description: string,
  configFields: ConfigField[],
  functionality: string
}

PROCESS:
1. Validate input parameters
2. Generate all naming variants
3. Select color scheme from category
4. Create directory structure
5. Generate each file from template
6. Replace all placeholder variables
7. Create BluePrint-Node-{TYPE_NAME}.md documentation
8. Validate generated code
9. Update integration points

OUTPUT: Complete, functional node directory with technical specification
```

This blueprint ensures AI-generated nodes are production-ready and fully compatible with the existing FlowBuilder architecture.