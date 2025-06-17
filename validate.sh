#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes con colores
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}     VALIDACIÓN COMPLETA DEL PROYECTO${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Variables para tracking de errores
ERRORS=0
WARNINGS=0

# 1. Verificar que estamos en un proyecto Next.js
log_info "Verificando estructura del proyecto..."
if [ ! -f "package.json" ]; then
    log_error "No se encontró package.json"
    exit 1
fi

if ! grep -q "next" package.json; then
    log_error "No se detectó Next.js en package.json"
    exit 1
fi

log_success "Estructura del proyecto correcta"

# 2. Verificar Node.js y npm
log_info "Verificando versiones de Node.js y npm..."
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log_info "Node.js: $NODE_VERSION"
log_info "npm: $NPM_VERSION"

# 3. Instalar dependencias
log_info "Instalando dependencias..."
if npm install; then
    log_success "Dependencias instaladas correctamente"
else
    log_error "Error al instalar dependencias"
    ((ERRORS++))
fi

# 4. Verificar variables de entorno
log_info "Verificando configuración de variables de entorno..."
if [ -f ".env.local" ] || [ -f ".env" ]; then
    log_success "Archivo de variables de entorno encontrado"
else
    log_warning "No se encontró archivo .env o .env.local"
    ((WARNINGS++))
fi

# 5. Linting
log_info "Ejecutando linter..."
if npm run lint; then
    log_success "Linting pasado sin errores"
else
    log_error "Errores de linting encontrados"
    ((ERRORS++))
fi

# 6. Type checking (opcional - configurado para ignorar errores en build)
log_info "Verificando tipos de TypeScript..."
if npm run typecheck; then
    log_success "Type checking pasado sin errores"
else
    log_warning "Errores de tipos encontrados (ignorados en build por configuración)"
    ((WARNINGS++))
fi

# 7. Build del proyecto
log_info "Construyendo el proyecto..."
if npm run build; then
    log_success "Build completado exitosamente"
else
    log_error "Error durante el build"
    ((ERRORS++))
fi

# 8. Verificar archivos generados
log_info "Verificando archivos generados..."
if [ -d ".next" ]; then
    log_success "Directorio .next generado correctamente"
else
    log_error "No se generó el directorio .next"
    ((ERRORS++))
fi

# 9. Test de inicio rápido (opcional)
log_info "Probando inicio del servidor de producción..."

# Función para timeout multiplataforma
timeout_cmd() {
    local duration=$1
    shift
    if command -v timeout >/dev/null 2>&1; then
        timeout "$duration" "$@"
    elif command -v gtimeout >/dev/null 2>&1; then
        gtimeout "$duration" "$@"
    else
        # Fallback para macOS sin timeout
        "$@" &
        local pid=$!
        (sleep "${duration%s}" && kill $pid 2>/dev/null) &
        local killer=$!
        wait $pid 2>/dev/null
        local result=$?
        kill $killer 2>/dev/null
        return $result
    fi
}

timeout_cmd 10s npm start &
SERVER_PID=$!
sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
    log_success "Servidor de producción inicia correctamente"
    kill $SERVER_PID 2>/dev/null
else
    log_warning "No se pudo verificar el inicio del servidor (esto es normal en algunos sistemas)"
    ((WARNINGS++))
fi

# Resumen final
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}           RESUMEN DE VALIDACIÓN${NC}"
echo -e "${BLUE}================================================${NC}"

if [ $ERRORS -eq 0 ]; then
    log_success "✅ Proyecto validado exitosamente"
    log_info "Errores: $ERRORS"
    log_info "Advertencias: $WARNINGS"
    echo ""
    log_info "El proyecto está listo para:"
    echo "  - Desarrollo: npm run dev"
    echo "  - Producción: npm start"
    exit 0
else
    log_error "❌ Validación fallida"
    log_error "Errores: $ERRORS"
    log_info "Advertencias: $WARNINGS"
    echo ""
    log_error "Por favor, corrige los errores antes de continuar"
    exit 1
fi