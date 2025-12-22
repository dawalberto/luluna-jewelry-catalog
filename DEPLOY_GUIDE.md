# 🚀 Guía de Despliegue en GitHub Pages

## 📋 Pre-requisitos

- ✅ Cuenta de GitHub
- ✅ Proyecto Astro configurado
- ✅ Node.js 18.20.8 o superior

## 🎯 Pasos para el Despliegue

### **1️⃣ Crear Repositorio en GitHub**

1. Ve a [github.com/new](https://github.com/new)
2. Configura:
   - **Repository name**: `luluna-jewelry-catalog`
   - **Visibility**: Public o Private
   - ❌ NO marques "Add a README file"
3. Clic en **"Create repository"**
4. Copia la URL que aparece (ejemplo: `https://github.com/TU-USUARIO/luluna-jewelry-catalog.git`)

### **2️⃣ Actualizar Configuración de Astro**

Edita el archivo `astro.config.mjs` y reemplaza `TU-USUARIO` con tu nombre de usuario real de GitHub:

```javascript
export default defineConfig({
  site: 'https://TU-USUARIO.github.io',  // 👈 Cambia TU-USUARIO
  base: '/luluna-jewelry-catalog',
  // ... resto de configuración
});
```

### **3️⃣ Conectar Repositorio Local con GitHub**

Ejecuta estos comandos en tu terminal (reemplaza `TU-USUARIO`):

```bash
# Método 1: Usando el script
bash setup-github.sh

# Método 2: Manual
git init
git branch -M main
git remote add origin https://github.com/TU-USUARIO/luluna-jewelry-catalog.git
git add .
git commit -m "🎉 Initial commit - LuLuna Jewelry Catalog"
git push -u origin main
```

### **4️⃣ Configurar GitHub Pages**

1. Ve a tu repositorio en GitHub
2. Navega a **Settings** → **Pages**
3. En **"Source"**, selecciona: **GitHub Actions**

![GitHub Pages Configuration](https://docs.github.com/assets/cb-47267/mw-1440/images/help/pages/creating-custom-github-actions-workflow.webp)

### **5️⃣ Configurar Secrets (Variables de Entorno)**

GitHub Actions necesita acceso a tus credenciales de Firebase y Cloudinary:

1. Ve a **Settings** → **Secrets and variables** → **Actions**
2. Clic en **"New repository secret"**
3. Agrega estos secrets (uno por uno):

#### Firebase Secrets:
- `PUBLIC_FIREBASE_API_KEY`
- `PUBLIC_FIREBASE_AUTH_DOMAIN`
- `PUBLIC_FIREBASE_PROJECT_ID`
- `PUBLIC_FIREBASE_STORAGE_BUCKET`
- `PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `PUBLIC_FIREBASE_APP_ID`

#### Cloudinary Secrets:
- `PUBLIC_CLOUDINARY_CLOUD_NAME`
- `PUBLIC_CLOUDINARY_API_KEY`
- `PUBLIC_CLOUDINARY_UPLOAD_PRESET`

**💡 Tip**: Puedes copiar los valores de tu archivo `.env` local

### **6️⃣ Verificar el Despliegue**

1. Ve a la pestaña **Actions** en tu repositorio
2. Deberías ver un workflow ejecutándose
3. Espera a que termine (icono verde ✅)
4. Tu sitio estará disponible en: `https://TU-USUARIO.github.io/luluna-jewelry-catalog`

## 🔄 Despliegue Automático

**Ya está configurado** ✅ Cada vez que hagas:

```bash
git add .
git commit -m "descripción de cambios"
git push
```

GitHub Actions automáticamente:
1. Construye tu aplicación
2. La despliega en GitHub Pages
3. Actualiza el sitio en producción

## 🛠️ Comandos Útiles

```bash
# Ver estado del repositorio
git status

# Hacer commit y push de cambios
git add .
git commit -m "feat: nueva funcionalidad"
git push

# Ver historial de commits
git log --oneline

# Ver workflows en ejecución (en GitHub)
# Ve a: https://github.com/TU-USUARIO/luluna-jewelry-catalog/actions
```

## 🔍 Troubleshooting

### ❌ Error: "Site not found"
- Verifica que GitHub Pages esté configurado en Settings → Pages
- Source debe ser "GitHub Actions"

### ❌ Build falla en GitHub Actions
- Revisa que todos los secrets estén configurados correctamente
- Ve a la pestaña Actions para ver los logs de error

### ❌ La página muestra pero sin estilos
- Verifica que `base: '/luluna-jewelry-catalog'` esté en `astro.config.mjs`
- Verifica que `site` tenga tu usuario correcto

### ❌ Firebase no funciona en producción
- Asegúrate de que todos los secrets de Firebase estén configurados
- Verifica en Firebase Console que el dominio de GitHub Pages esté autorizado

## 📝 Checklist Final

- [ ] Repositorio creado en GitHub
- [ ] `astro.config.mjs` actualizado con tu usuario
- [ ] Código subido a GitHub (git push)
- [ ] GitHub Pages configurado (Settings → Pages)
- [ ] Secrets de Firebase agregados
- [ ] Secrets de Cloudinary agregados
- [ ] Workflow ejecutado exitosamente (Actions)
- [ ] Sitio accesible en `https://TU-USUARIO.github.io/luluna-jewelry-catalog`

## 🎉 ¡Listo!

Tu aplicación está ahora en producción y se actualizará automáticamente con cada push a la rama `main`.

**URL de tu sitio**: `https://TU-USUARIO.github.io/luluna-jewelry-catalog`

---

**Documentación útil**:
- [GitHub Pages](https://pages.github.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Astro Deploy](https://docs.astro.build/en/guides/deploy/github/)
