#!/bin/bash

# Script para ejecutar el proyecto con Docker
# Autor: Sistema automatizado
# Fecha: $(date)

set -e

echo "🐳 Iniciando proyecto con Docker..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}Uso: ./run-docker.sh [OPCIÓN]${NC}"
    echo ""
    echo "Opciones disponibles:"
    echo "  dev        Ejecutar en modo desarrollo (por defecto)"
    echo "  prod       Ejecutar en modo producción"
    echo "  build      Solo construir las imágenes"
    echo "  stop       Detener todos los contenedores"
    echo "  clean      Limpiar contenedores e imágenes"
    echo "  logs       Ver logs de los contenedores"
    echo "  help       Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./run-docker.sh dev"
    echo "  ./run-docker.sh prod"
    echo "  ./run-docker.sh clean"
}

# Función para verificar Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker no está instalado${NC}"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker no está ejecutándose${NC}"
        echo -e "${YELLOW}💡 Iniciando Docker Desktop...${NC}"
        open -a Docker
        echo "⏳ Esperando que Docker inicie..."
        sleep 15
        
        if ! docker info &> /dev/null; then
            echo -e "${RED}❌ No se pudo conectar a Docker${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Docker está listo${NC}"
}

# Función para desarrollo
run_dev() {
    echo -e "${BLUE}🚀 Ejecutando en modo DESARROLLO...${NC}"
    echo -e "${YELLOW}📍 URL: http://localhost:3048${NC}"
    docker-compose up app-dev
}

# Función para producción
run_prod() {
    echo -e "${BLUE}🚀 Ejecutando en modo PRODUCCIÓN...${NC}"
    echo -e "${YELLOW}📍 URL: http://localhost:3048${NC}"
    docker-compose up app
}

# Función para solo build
build_only() {
    echo -e "${BLUE}🔨 Construyendo imágenes...${NC}"
    docker-compose build
    echo -e "${GREEN}✅ Imágenes construidas exitosamente${NC}"
}

# Función para detener
stop_containers() {
    echo -e "${YELLOW}⏹️  Deteniendo contenedores...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Contenedores detenidos${NC}"
}

# Función para limpiar
clean_docker() {
    echo -e "${YELLOW}🧹 Limpiando contenedores e imágenes...${NC}"
    docker-compose down --rmi all --volumes --remove-orphans
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

# Función para ver logs
show_logs() {
    echo -e "${BLUE}📋 Mostrando logs...${NC}"
    docker-compose logs -f
}

# Verificar Docker antes de cualquier operación
check_docker

# Manejar argumentos
case "${1:-dev}" in
    "dev")
        run_dev
        ;;
    "prod")
        run_prod
        ;;
    "build")
        build_only
        ;;
    "stop")
        stop_containers
        ;;
    "clean")
        clean_docker
        ;;
    "logs")
        show_logs
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Opción no válida: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac