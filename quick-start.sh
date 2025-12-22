#!/bin/bash

echo "🚀 Inicio Rápido - LuLuna Jewelry Catalog"
echo "=========================================="
echo ""

# Check Node version
NODE_VERSION=$(node --version)
echo "1️⃣  Versión de Node.js: $NODE_VERSION"

if [[ "$NODE_VERSION" < "v18.20.8" ]]; then
    echo "   ⚠️  Necesitas actualizar Node.js"
    echo ""
    echo "   Opción 1 - Usando nvm:"
    echo "   $ nvm install 20"
    echo "   $ nvm use 20"
    echo ""
    echo "   Opción 2 - Usando Homebrew:"
    echo "   $ brew install node@20"
    echo ""
    exit 1
fi

echo "   ✅ Node.js OK"
echo ""

# Check .env
echo "2️⃣  Verificando configuración..."
if [ ! -f ".env" ]; then
    echo "   📝 Creando archivo .env..."
    cp .env.example .env
    echo "   ✅ Archivo .env creado"
    echo ""
    echo "   ⚠️  IMPORTANTE: Edita .env con tus credenciales:"
    echo "   - Firebase (https://console.firebase.google.com)"
    echo "   - Cloudinary (https://cloudinary.com/console)"
    echo ""
    echo "   Luego ejecuta este script nuevamente."
    exit 0
fi

if grep -q "your_api_key_here" .env || grep -q "your-project-id" .env; then
    echo "   ⚠️  .env contiene valores por defecto"
    echo ""
    echo "   Por favor edita .env con tus credenciales:"
    echo "   $ nano .env"
    echo "   o"
    echo "   $ code .env"
    echo ""
    exit 1
fi

echo "   ✅ Configuración OK"
echo ""

# Check dependencies
echo "3️⃣  Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo "   📦 Instalando dependencias..."
    npm install
    echo "   ✅ Dependencias instaladas"
else
    echo "   ✅ Dependencias OK"
fi
echo ""

# Success!
echo "✅ ¡Todo listo!"
echo ""
echo "🎯 Siguientes pasos:"
echo ""
echo "1. Configurar Firebase:"
echo "   $ firebase login"
echo "   $ firebase init"
echo "   $ firebase deploy --only firestore:rules,storage:rules"
echo ""
echo "2. Iniciar servidor de desarrollo:"
echo "   $ npm run dev"
echo ""
echo "3. Abrir navegador:"
echo "   http://localhost:4321"
echo ""
echo "4. Acceder al admin (después de configurar Auth):"
echo "   http://localhost:4321/admin"
echo ""
echo "📚 Documentación:"
echo "   - README.md - Documentación completa"
echo "   - SETUP.md - Guía detallada de configuración"
echo "   - PROJECT_SUMMARY.md - Resumen del proyecto"
echo ""
echo "🎨 Rutas disponibles:"
echo "   / - Home"
echo "   /catalog - Catálogo de productos"
echo "   /admin - Panel de administración"
echo ""
echo "✨ ¡Disfruta construyendo tu catálogo!"
