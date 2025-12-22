#!/bin/bash

# Script para verificar el estado del proyecto LuLuna

echo "🌟 LuLuna Jewelry Catalog - Verificación del Proyecto"
echo "======================================================"
echo ""

# Verificar Node.js
echo "📦 Verificando Node.js..."
NODE_VERSION=$(node --version)
echo "   Versión actual: $NODE_VERSION"
REQUIRED_VERSION="v18.20.8"

if [[ "$NODE_VERSION" < "$REQUIRED_VERSION" ]]; then
    echo "   ⚠️  ADVERTENCIA: Se requiere Node.js >= $REQUIRED_VERSION"
    echo "   Por favor actualiza Node.js. Ver SETUP.md para instrucciones"
else
    echo "   ✅ Versión de Node.js correcta"
fi
echo ""

# Verificar dependencias
echo "📚 Verificando dependencias..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules existe"
else
    echo "   ⚠️  node_modules no encontrado. Ejecuta: npm install"
fi
echo ""

# Verificar .env
echo "🔐 Verificando configuración..."
if [ -f ".env" ]; then
    echo "   ✅ Archivo .env encontrado"
    
    # Verificar que las variables estén configuradas
    if grep -q "your_api_key_here" .env || grep -q "your-project-id" .env; then
        echo "   ⚠️  ADVERTENCIA: .env contiene valores por defecto"
        echo "   Por favor configura tus credenciales de Firebase y Cloudinary"
    else
        echo "   ✅ Variables de entorno configuradas"
    fi
else
    echo "   ⚠️  Archivo .env no encontrado"
    echo "   Ejecuta: cp .env.example .env"
    echo "   Luego edita .env con tus credenciales"
fi
echo ""

# Verificar estructura de archivos clave
echo "📁 Verificando estructura del proyecto..."
files_to_check=(
    "src/pages/index.astro"
    "src/pages/catalog.astro"
    "src/pages/admin.astro"
    "src/components/catalog/CatalogView.tsx"
    "src/components/admin/AdminPanel.tsx"
    "src/services/ProductService.ts"
    "src/repositories/ProductRepository.ts"
    "firestore.rules"
    "storage.rules"
    ".github/workflows/deploy.yml"
)

missing_files=0
for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file - FALTA"
        missing_files=$((missing_files + 1))
    fi
done

if [ $missing_files -eq 0 ]; then
    echo "   ✅ Todos los archivos principales existen"
else
    echo "   ⚠️  Faltan $missing_files archivos"
fi
echo ""

# Resumen
echo "📋 Resumen"
echo "=========="
echo ""

if [[ "$NODE_VERSION" < "$REQUIRED_VERSION" ]]; then
    echo "❌ Actualizar Node.js es REQUERIDO"
    echo "   Ver SETUP.md sección 'Actualizar Node.js'"
    echo ""
fi

if [ ! -f ".env" ]; then
    echo "❌ Configurar .env es REQUERIDO"
    echo "   1. cp .env.example .env"
    echo "   2. Editar .env con tus credenciales"
    echo "   Ver SETUP.md para más detalles"
    echo ""
fi

if [ ! -d "node_modules" ]; then
    echo "❌ Instalar dependencias es REQUERIDO"
    echo "   npm install"
    echo ""
fi

echo "📖 Documentación:"
echo "   - README.md - Documentación completa"
echo "   - SETUP.md - Guía de configuración inicial"
echo ""

echo "🚀 Próximos pasos:"
echo "   1. Actualizar Node.js si es necesario"
echo "   2. Configurar .env con credenciales"
echo "   3. Ejecutar: npm install"
echo "   4. Configurar Firebase (ver SETUP.md)"
echo "   5. Configurar Cloudinary (ver SETUP.md)"
echo "   6. Ejecutar: npm run dev"
echo ""

echo "✨ ¡Buena suerte con tu proyecto LuLuna!"
