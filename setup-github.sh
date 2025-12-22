#!/bin/bash

# 🎯 Script para configurar y desplegar en GitHub Pages
# Ejecuta este script después de crear tu repositorio en GitHub

echo "📝 INSTRUCCIONES:"
echo "1. Reemplaza TU-USUARIO con tu nombre de usuario de GitHub"
echo "2. Actualiza astro.config.mjs con tu usuario"
echo "3. Ejecuta este script: bash setup-github.sh"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Solicitar el usuario de GitHub
read -p "Ingresa tu nombre de usuario de GitHub: " GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo "❌ Error: Debes proporcionar un nombre de usuario"
    exit 1
fi

echo -e "${BLUE}🔧 Configurando repositorio...${NC}"

# Inicializar git si no existe
if [ ! -d .git ]; then
    git init
    echo -e "${GREEN}✅ Git inicializado${NC}"
fi

# Agregar el remoto
git remote add origin "https://github.com/$GITHUB_USER/luluna-jewelry-catalog.git"
echo -e "${GREEN}✅ Remoto agregado${NC}"

# Crear rama main si no existe
git branch -M main

# Agregar todos los archivos
git add .
echo -e "${GREEN}✅ Archivos agregados${NC}"

# Hacer el primer commit
git commit -m "🎉 Initial commit - LuLuna Jewelry Catalog"
echo -e "${GREEN}✅ Commit creado${NC}"

echo ""
echo -e "${BLUE}📤 Ahora ejecuta:${NC}"
echo "   git push -u origin main"
echo ""
echo -e "${BLUE}📋 Después, configura GitHub Pages:${NC}"
echo "   1. Ve a Settings → Pages"
echo "   2. Source: GitHub Actions"
echo "   3. Agrega los secrets de Firebase y Cloudinary"
