#!/bin/bash

echo "🐳 Docker CMR Application Launcher"
echo "=================================="
echo ""
echo "Selecciona el modo de ejecución:"
echo "1) Desarrollo (app-dev) - Puerto 3049"
echo "2) Producción (app) - Puerto 3048"
echo "3) Construir y ejecutar producción"
echo "4) Parar todos los contenedores"
echo ""

read -p "Opción (1-4): " option

case $option in
    1)
        echo "🚀 Iniciando en modo desarrollo..."
        docker-compose up app-dev
        ;;
    2)
        echo "🚀 Iniciando en modo producción..."
        docker-compose up app
        ;;
    3)
        echo "🔨 Construyendo y ejecutando en producción..."
        docker-compose build app
        docker-compose up app
        ;;
    4)
        echo "🛑 Parando todos los contenedores..."
        docker-compose down
        ;;
    *)
        echo "❌ Opción no válida"
        exit 1
        ;;
esac