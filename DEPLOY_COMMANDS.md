# 🚀 Comandos de Despliegue - Referencia Rápida

## 📦 Configuración Inicial (una sola vez)

### 1. Crear repositorio en GitHub
Ve a: https://github.com/new
- Nombre: `luluna-jewelry-catalog`
- NO marques "Add a README"

### 2. Actualizar usuario en astro.config.mjs
```bash
# Abre el archivo y reemplaza TU-USUARIO con tu usuario real de GitHub
# Línea 10: site: 'https://TU-USUARIO.github.io',
```

### 3. Conectar con GitHub
```bash
# Reemplaza TU-USUARIO con tu usuario de GitHub
git remote add origin https://github.com/TU-USUARIO/luluna-jewelry-catalog.git
git branch -M main
git add .
git commit -m "🎉 Initial commit - LuLuna Jewelry Catalog"
git push -u origin main
```

### 4. Configurar GitHub Pages
1. Ve a tu repo: `https://github.com/TU-USUARIO/luluna-jewelry-catalog`
2. **Settings** → **Pages**
3. **Source**: Selecciona "GitHub Actions"

### 5. Agregar Secrets
Ve a: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Agrega estos secrets (cópialos de tu archivo `.env`):

**Firebase:**
```
PUBLIC_FIREBASE_API_KEY
PUBLIC_FIREBASE_AUTH_DOMAIN
PUBLIC_FIREBASE_PROJECT_ID
PUBLIC_FIREBASE_STORAGE_BUCKET
PUBLIC_FIREBASE_MESSAGING_SENDER_ID
PUBLIC_FIREBASE_APP_ID
```

**Cloudinary:**
```
PUBLIC_CLOUDINARY_CLOUD_NAME
PUBLIC_CLOUDINARY_API_KEY
PUBLIC_CLOUDINARY_UPLOAD_PRESET
```

---

## 🔄 Workflow Diario (después de configuración)

### Hacer cambios y desplegar
```bash
# 1. Ver archivos modificados
git status

# 2. Agregar cambios
git add .

# 3. Hacer commit (usa mensajes descriptivos)
git commit -m "feat: agregar nueva funcionalidad"
git commit -m "fix: corregir error en catálogo"
git commit -m "style: mejorar diseño de productos"

# 4. Subir a GitHub (esto despliega automáticamente)
git push
```

**✨ El despliegue es automático** - GitHub Actions construye y despliega tu sitio cada vez que haces push.

### Ver el estado del despliegue
```bash
# Ver workflows en ejecución
# Ve a: https://github.com/TU-USUARIO/luluna-jewelry-catalog/actions

# O usa el CLI de GitHub (opcional)
gh run list
gh run watch
```

---

## 🛠️ Comandos Útiles

### Git básico
```bash
# Ver historial de commits
git log --oneline -10

# Ver diferencias antes de commit
git diff

# Deshacer cambios no guardados
git restore archivo.tsx

# Ver ramas
git branch -a

# Crear nueva rama (para features)
git checkout -b feature/nueva-funcionalidad
```

### Desarrollo local
```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build local (probar antes de desplegar)
npm run build

# Preview del build
npm run preview
```

### Verificación
```bash
# Verificar configuración para deploy
./check-deploy-config.sh

# Ver estado del repositorio
git status

# Ver remoto configurado
git remote -v
```

---

## 📊 Estructura del Workflow Automático

Cuando haces `git push`, GitHub Actions ejecuta:

```
1. 🔧 Checkout del código
2. 📦 Instalar Node.js 20
3. 📥 Instalar dependencias (npm ci)
4. 🏗️  Build del proyecto (npm run build)
5. 📤 Subir artefactos a GitHub Pages
6. 🚀 Desplegar en producción
```

**Tiempo aproximado**: 2-3 minutos

---

## 🔗 URLs Importantes

| Descripción | URL |
|-------------|-----|
| Tu sitio en producción | `https://TU-USUARIO.github.io/luluna-jewelry-catalog` |
| Repositorio | `https://github.com/TU-USUARIO/luluna-jewelry-catalog` |
| GitHub Actions | `https://github.com/TU-USUARIO/luluna-jewelry-catalog/actions` |
| Configuración Pages | `https://github.com/TU-USUARIO/luluna-jewelry-catalog/settings/pages` |
| Secrets | `https://github.com/TU-USUARIO/luluna-jewelry-catalog/settings/secrets/actions` |

---

## ⚡ Tips Rápidos

### Mensajes de commit
Usa prefijos descriptivos:
- `feat:` nueva funcionalidad
- `fix:` corrección de bugs
- `style:` cambios de estilos
- `refactor:` refactorización de código
- `docs:` cambios en documentación
- `chore:` tareas de mantenimiento

### Forzar rebuild
Si el sitio no se actualiza:
```bash
# Hacer un commit vacío para forzar deploy
git commit --allow-empty -m "chore: force rebuild"
git push
```

### Ver logs del último despliegue
1. Ve a la pestaña **Actions**
2. Clic en el workflow más reciente
3. Revisa los logs de cada paso

### Rollback (volver a versión anterior)
```bash
# Ver commits recientes
git log --oneline

# Revertir al commit anterior
git revert HEAD
git push

# O volver a un commit específico
git revert abc123
git push
```

---

## 🆘 Solución de Problemas

### El sitio muestra "404"
```bash
# Verifica que base esté correcto en astro.config.mjs
# Debe ser: base: '/luluna-jewelry-catalog'
```

### Build falla en GitHub Actions
```bash
# 1. Revisa los logs en Actions
# 2. Verifica que todos los secrets estén configurados
# 3. Prueba el build local:
npm run build
```

### Git push rechazado
```bash
# Primero hacer pull de cambios remotos
git pull origin main --rebase
git push
```

---

## 📚 Recursos

- [Guía completa](DEPLOY_GUIDE.md)
- [GitHub Pages Docs](https://pages.github.com/)
- [Astro Deploy Guide](https://docs.astro.build/en/guides/deploy/github/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

**✅ Recuerda**: Cada `git push` despliega automáticamente a producción. ¡No hay pasos adicionales!
