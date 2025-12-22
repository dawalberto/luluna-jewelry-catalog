#!/bin/bash

# 🎨 Script para verificar la configuración antes del despliegue
# Ejecuta: bash check-deploy-config.sh

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🔍 Verificación de Configuración para GitHub Pages${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar si estamos en un repositorio git
if [ ! -d .git ]; then
    echo -e "${RED}❌ No es un repositorio git${NC}"
    echo -e "   Ejecuta: ${YELLOW}git init${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Repositorio git inicializado${NC}"
fi

# Verificar si existe el workflow
if [ -f .github/workflows/deploy.yml ]; then
    echo -e "${GREEN}✅ Workflow de GitHub Actions encontrado${NC}"
else
    echo -e "${RED}❌ Workflow de GitHub Actions no encontrado${NC}"
    exit 1
fi

# Verificar astro.config.mjs
if grep -q "TU-USUARIO" astro.config.mjs 2>/dev/null; then
    echo -e "${YELLOW}⚠️  astro.config.mjs contiene 'TU-USUARIO' - necesitas actualizarlo${NC}"
    echo -e "   Edita astro.config.mjs y reemplaza 'TU-USUARIO' con tu usuario de GitHub"
else
    echo -e "${GREEN}✅ astro.config.mjs configurado${NC}"
fi

# Verificar si tiene remoto configurado
if git remote | grep -q origin; then
    REMOTE_URL=$(git remote get-url origin)
    echo -e "${GREEN}✅ Remoto configurado: ${NC}$REMOTE_URL"
else
    echo -e "${YELLOW}⚠️  No hay remoto configurado${NC}"
    echo -e "   Ejecuta: ${YELLOW}git remote add origin https://github.com/TU-USUARIO/luluna-jewelry-catalog.git${NC}"
fi

# Verificar .env
if [ -f .env ]; then
    echo -e "${GREEN}✅ Archivo .env encontrado${NC}"
    
    # Lista de variables requeridas
    REQUIRED_VARS=(
        "PUBLIC_FIREBASE_API_KEY"
        "PUBLIC_FIREBASE_AUTH_DOMAIN"
        "PUBLIC_FIREBASE_PROJECT_ID"
        "PUBLIC_CLOUDINARY_CLOUD_NAME"
    )
    
    MISSING_VARS=()
    for VAR in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "$VAR" .env; then
            MISSING_VARS+=("$VAR")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ Variables de entorno básicas configuradas${NC}"
    else
        echo -e "${YELLOW}⚠️  Faltan variables de entorno:${NC}"
        for VAR in "${MISSING_VARS[@]}"; do
            echo -e "   - $VAR"
        done
    fi
else
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado${NC}"
    echo -e "   Crea un archivo .env con tus credenciales"
fi

# Verificar node_modules
if [ -d node_modules ]; then
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
else
    echo -e "${YELLOW}⚠️  Dependencias no instaladas${NC}"
    echo -e "   Ejecuta: ${YELLOW}npm install${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  📋 Próximos Pasos${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "1. ${YELLOW}Crea un repositorio en GitHub${NC}"
echo -e "   → https://github.com/new"
echo ""
echo -e "2. ${YELLOW}Actualiza astro.config.mjs${NC}"
echo -e "   → Reemplaza 'TU-USUARIO' con tu usuario de GitHub"
echo ""
echo -e "3. ${YELLOW}Conecta el repositorio${NC}"
echo -e "   → git remote add origin https://github.com/TU-USUARIO/luluna-jewelry-catalog.git"
echo ""
echo -e "4. ${YELLOW}Haz el primer push${NC}"
echo -e "   → git add ."
echo -e "   → git commit -m '🎉 Initial commit'"
echo -e "   → git push -u origin main"
echo ""
echo -e "5. ${YELLOW}Configura GitHub Pages${NC}"
echo -e "   → Settings → Pages → Source: GitHub Actions"
echo ""
echo -e "6. ${YELLOW}Agrega los secrets${NC}"
echo -e "   → Settings → Secrets and variables → Actions"
echo -e "   → Agrega las credenciales de Firebase y Cloudinary"
echo ""
echo -e "${GREEN}📖 Documentación completa: DEPLOY_GUIDE.md${NC}"
echo ""
