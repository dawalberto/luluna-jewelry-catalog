# Configuración Inicial del Proyecto

## ⚠️ Requisito Importante: Versión de Node.js

Este proyecto requiere **Node.js >= 18.20.8**. Tu versión actual es `v18.17.1`.

### Actualizar Node.js (macOS)

#### Opción 1: Usando nvm (Recomendado)

```bash
# Instalar nvm si no lo tienes
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reiniciar terminal o ejecutar:
source ~/.zshrc

# Instalar Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verificar versión
node --version  # Debería mostrar v20.x.x
```

#### Opción 2: Usando Homebrew

```bash
# Actualizar Homebrew
brew update

# Instalar Node.js
brew install node@20

# Agregar a PATH (agregar a ~/.zshrc)
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Reiniciar terminal y verificar
node --version
```

## 📋 Pasos Siguientes

### 1. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env y completar con tus credenciales
# - Firebase (obtener de Firebase Console)
# - Cloudinary (obtener de Cloudinary Dashboard)
```

### 2. Configurar Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Crear nuevo proyecto o usar existente
3. Habilitar:
   - ✅ Firestore Database
   - ✅ Firebase Storage  
   - ✅ Authentication (Email/Password)
4. Copiar credenciales a `.env`

**Configurar Firebase CLI:**

```bash
# Instalar Firebase Tools
npm install -g firebase-tools

# Login
firebase login

# Inicializar proyecto (ejecutar en la raíz del proyecto)
firebase init

# Seleccionar:
# - Firestore
# - Storage
# - Usar archivos firestore.rules y storage.rules existentes

# Desplegar reglas
firebase deploy --only firestore:rules,storage:rules
```

### 3. Configurar Cloudinary

1. Crear cuenta en [Cloudinary](https://cloudinary.com)
2. Ir a Dashboard
3. Copiar:
   - Cloud Name
   - API Key
   - API Secret
4. Crear Upload Preset:
   - Settings > Upload > Upload presets
   - Add upload preset
   - Signing Mode: **Unsigned**
   - Folder: `luluna/products`
   - Guardar el nombre del preset

### 4. Instalar Dependencias y Ejecutar

Una vez actualizaste Node.js:

```bash
# Reinstalar dependencias (por si acaso)
rm -rf node_modules package-lock.json
npm install

# Ejecutar en desarrollo
npm run dev

# El sitio estará en http://localhost:4321
```

### 5. Probar el Proyecto

1. **Página Principal:** http://localhost:4321
2. **Catálogo:** http://localhost:4321/catalog
3. **Admin:** http://localhost:4321/admin

### 6. Crear Primer Producto (Ejemplo)

Para probar el admin panel, primero necesitas autenticarte:

1. Ir a Firebase Console > Authentication
2. Agregar usuario manualmente (Email/Password)
3. Implementar login en el admin (o usar directamente por ahora)

O crear productos directamente en Firestore Console:

```json
{
  "title": {
    "es": "Anillo de Plata",
    "en": "Silver Ring"
  },
  "description": {
    "es": "Hermoso anillo de plata artesanal",
    "en": "Beautiful handcrafted silver ring"
  },
  "price": 45.99,
  "category": "rings",
  "images": ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
  "published": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

## 🚀 Despliegue a GitHub Pages

### Configuración

1. Actualizar `astro.config.mjs`:

```javascript
export default defineConfig({
  site: 'https://TU-USUARIO.github.io',
  base: '/luluna-jewelry-catalog',
  // ...resto
});
```

2. Crear repositorio en GitHub
3. Configurar GitHub Secrets (Settings > Secrets and variables > Actions):
   - Agregar todas las variables de `.env` como secrets
4. Push al repositorio:

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/luluna-jewelry-catalog.git
git push -u origin main
```

5. Habilitar GitHub Pages:
   - Settings > Pages
   - Source: GitHub Actions

6. El workflow en `.github/workflows/deploy.yml` se ejecutará automáticamente

## 📚 Documentación Adicional

- [README.md](./README.md) - Documentación completa del proyecto
- [Astro Docs](https://docs.astro.build)
- [Firebase Docs](https://firebase.google.com/docs)
- [Cloudinary Docs](https://cloudinary.com/documentation)

## ❓ Solución de Problemas

### Error: "Module not found"
```bash
rm -rf node_modules package-lock.json .astro
npm install
```

### Error en Firebase
- Verificar que todas las variables en `.env` estén correctas
- Verificar que Firestore y Storage estén habilitados
- Verificar reglas de seguridad

### Imágenes no cargan
- Verificar credenciales de Cloudinary en `.env`
- Verificar que el Upload Preset sea "Unsigned"

## 🎯 Next Steps

1. ✅ Actualizar Node.js
2. ✅ Configurar Firebase
3. ✅ Configurar Cloudinary
4. ✅ Completar `.env`
5. ✅ Ejecutar `npm run dev`
6. ✅ Crear productos de prueba
7. ✅ Desplegar a GitHub Pages

¡Listo para comenzar! 🚀
