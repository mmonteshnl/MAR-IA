#!/usr/bin/env node

/**
 * Script para generar un nuevo nodo basado en el template BaseNode
 * 
 * Uso:
 *   node generate-node.js MiNuevoNodo "Mi Nuevo Nodo" api Globe blue
 * 
 * Parámetros:
 *   1. nodeName (PascalCase): Nombre del nodo en código (ej: HttpRequestNode)
 *   2. displayName: Nombre mostrado en UI (ej: "HTTP Request")
 *   3. category: Categoría del nodo (api, data, utility, transform, etc.)
 *   4. icon: Nombre del icono de Lucide (ej: Globe, Database, Cpu)
 *   5. color: Color principal del nodo (blue, green, purple, red, etc.)
 */

const fs = require('fs');
const path = require('path');

// Validar argumentos
const args = process.argv.slice(2);
if (args.length < 5) {
  console.error('❌ Error: Faltan argumentos');
  console.log('📋 Uso: node generate-node.js <NodeName> "<Display Name>" <category> <icon> <color>');
  console.log('📋 Ejemplo: node generate-node.js DatabaseQueryNode "Consulta de Base de Datos" data Database green');
  process.exit(1);
}

const [nodeName, displayName, category, icon, color] = args;

// Validaciones
if (!/^[A-Z][a-zA-Z0-9]*Node$/.test(nodeName)) {
  console.error('❌ Error: El nombre del nodo debe estar en PascalCase y terminar con "Node"');
  console.log('✅ Ejemplo válido: DatabaseQueryNode, EmailSenderNode, DataTransformNode');
  process.exit(1);
}

const validCategories = ['api', 'data', 'utility', 'transform', 'database', 'messaging', 'ai'];
if (!validCategories.includes(category)) {
  console.error(`❌ Error: La categoría debe ser una de: ${validCategories.join(', ')}`);
  process.exit(1);
}

// Generar nombres derivados
const nodeTypeName = nodeName.replace('Node', ''); // DatabaseQuery
const lowerCamelCase = nodeTypeName.charAt(0).toLowerCase() + nodeTypeName.slice(1); // databaseQuery
const kebabCase = nodeTypeName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(); // database-query
const upperSnakeCase = nodeTypeName.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase(); // DATABASE_QUERY

console.log(`🚀 Generando nodo: ${nodeName}`);
console.log(`📝 Nombre mostrado: ${displayName}`);
console.log(`📂 Categoría: ${category}`);
console.log(`🎨 Icono: ${icon}`);
console.log(`🎨 Color: ${color}`);

// Rutas
const templateDir = path.join(__dirname, 'BaseNode');
const targetDir = path.join(__dirname, '..', nodeName);

// Verificar que el template existe
if (!fs.existsSync(templateDir)) {
  console.error('❌ Error: No se encontró el template BaseNode');
  process.exit(1);
}

// Verificar que el directorio objetivo no existe
if (fs.existsSync(targetDir)) {
  console.error(`❌ Error: El directorio ${nodeName} ya existe`);
  process.exit(1);
}

// Mapeo de colores a clases Tailwind
const colorMap = {
  blue: {
    border: 'border-blue-500',
    text: 'text-blue-400',
    bg: 'bg-blue-50',
    darkBg: 'bg-blue-900'
  },
  green: {
    border: 'border-green-500',
    text: 'text-green-400',
    bg: 'bg-green-50',
    darkBg: 'bg-green-900'
  },
  purple: {
    border: 'border-purple-500',
    text: 'text-purple-400',
    bg: 'bg-purple-50',
    darkBg: 'bg-purple-900'
  },
  red: {
    border: 'border-red-500',
    text: 'text-red-400',
    bg: 'bg-red-50',
    darkBg: 'bg-red-900'
  },
  yellow: {
    border: 'border-yellow-500',
    text: 'text-yellow-400',
    bg: 'bg-yellow-50',
    darkBg: 'bg-yellow-900'
  },
  gray: {
    border: 'border-gray-500',
    text: 'text-gray-400',
    bg: 'bg-gray-50',
    darkBg: 'bg-gray-900'
  }
};

const colors = colorMap[color] || colorMap.gray;

// Funciones de reemplazo
const replacements = {
  'BaseNode': nodeName,
  'baseNode': lowerCamelCase,
  'base-node': kebabCase,
  'BASE_NODE': upperSnakeCase,
  'Base Node': displayName,
  'Nodo Base': displayName,
  'utility': category,
  'Settings': icon,
  'border-gray-500': colors.border,
  'text-gray-400': colors.text,
  'bg-gray-50': colors.bg,
  'bg-gray-900': colors.darkBg,
  'Nodo base template para desarrollo': `${displayName} - Nodo para ${category}`,
  'Este es un nodo template para desarrollo': `${displayName} proporciona funcionalidad de ${category}`,
};

function replaceInContent(content) {
  let result = content;
  for (const [search, replace] of Object.entries(replacements)) {
    result = result.split(search).join(replace);
  }
  return result;
}

function copyAndReplace(srcPath, destPath) {
  const stat = fs.statSync(srcPath);
  
  if (stat.isDirectory()) {
    fs.mkdirSync(destPath, { recursive: true });
    const files = fs.readdirSync(srcPath);
    
    for (const file of files) {
      copyAndReplace(
        path.join(srcPath, file),
        path.join(destPath, file.replace(/BaseNode/g, nodeName))
      );
    }
  } else {
    const content = fs.readFileSync(srcPath, 'utf8');
    const replacedContent = replaceInContent(content);
    fs.writeFileSync(destPath, replacedContent);
  }
}

// Copiar y procesar archivos
try {
  console.log('📁 Creando estructura de archivos...');
  copyAndReplace(templateDir, targetDir);
  
  console.log('✅ Nodo generado exitosamente!');
  console.log('');
  console.log('📋 Próximos pasos:');
  console.log(`1. cd ${nodeName}`);
  console.log('2. Implementar lógica específica en runner.ts');
  console.log('3. Actualizar schema.ts con campos requeridos');
  console.log('4. Personalizar UI en el componente principal');
  console.log('5. Configurar panel de settings');
  console.log('6. Integrar en el sistema principal:');
  console.log(`   - Agregar a nodes/index.ts`);
  console.log(`   - Actualizar types/nodeTypes.ts`);
  console.log(`   - Modificar FlowExecutor si es necesario`);
  console.log('');
  console.log('📚 Ver README.md en el directorio del nodo para más detalles');
  
} catch (error) {
  console.error('❌ Error generando el nodo:', error.message);
  process.exit(1);
}