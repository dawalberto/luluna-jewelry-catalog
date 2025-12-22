# 🌟 LuLuna Jewelry Catalog

> Catálogo headless de joyería artesanal con Astro + React + Firebase

[![Astro](https://img.shields.io/badge/Astro-4.x-FF5D01?logo=astro)](https://astro.build)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase)](https://firebase.google.com/)

## 📋 Índice

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Inicio Rápido](#-inicio-rápido)
- [Configuración](#-configuración)
- [Arquitectura](#-arquitectura)
- [Despliegue](#-despliegue)
- [Gestión de Productos](#-gestión-de-productos)
- [Principios SOLID](#-principios-solid)

## ✨ Características

- 🚀 **Renderizado estático rápido** con Astro
- ⚛️ **Interactividad dinámica** con React Islands
- 🔥 **Backend headless** con Firebase (Firestore + Storage)
- 🖼️ **Optimización automática de imágenes** con Cloudinary
- 🌍 **Multiidioma** (Español/Inglés) con i18n extensible
- 🎨 **Diseño minimalista elegante** con Tailwind CSS
- 📱 **Totalmente responsive**
- ♿ **Accesible** y optimizado para SEO
- 🔒 **Seguro** con reglas de Firebase
- 🎯 **Actualización en tiempo real** sin rebuild

## 🛠️ Stack Tecnológico

### Frontend
- **Astro 4.x** - Framework de sitios estáticos
- **React 19** - Componentes interactivos
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos utility-first
- **SWR** - Fetching y caché de datos

### Backend
- **Firebase Firestore** - Base de datos NoSQL
- **Firebase Storage** - Almacenamiento de imágenes
- **Firebase Auth** - Autenticación (admin)

### Servicios
- **Cloudinary** - CDN y optimización de imágenes
- **GitHub Pages** - Hosting estático gratuito

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 20+
- npm o pnpm
- Cuenta de Firebase
- Cuenta de Cloudinary

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/your-username/luluna-jewelry-catalog.git
cd luluna-jewelry-catalog

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Configurar Firebase y Cloudinary en .env
# (Ver sección Configuración)

# Iniciar servidor de desarrollo
npm run dev
```

El sitio estará disponible en `http://localhost:4321`

## ⚙️ Configuración

### 1. Firebase Setup

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar **Firestore Database**
3. Habilitar **Storage**
4. Habilitar **Authentication** (Email/Password para admin)
5. Copiar credenciales del proyecto

### 2. Firestore Database

Crear colección `products` con estructura:

```typescript
{
  title: {
    es: string,
    en: string
  },
  description: {
    es: string,
    en: string
  },
  price: number,
  category: 'rings' | 'necklaces' | 'bracelets' | 'earrings' | 'sets' | 'custom',
  images: string[],  // URLs de Cloudinary
  published: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. Firebase Security Rules

Subir reglas desde los archivos del proyecto:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Inicializar proyecto
firebase init

# Desplegar reglas
firebase deploy --only firestore:rules,storage:rules
```

Las reglas ya están configuradas en:
- `firestore.rules` - Lectura pública de productos publicados
- `storage.rules` - Lectura pública de imágenes

### 4. Cloudinary Setup

1. Crear cuenta en [Cloudinary](https://cloudinary.com)
2. Obtener **Cloud Name**, **API Key** y **API Secret**
3. Crear **Upload Preset** unsigned:
   - Settings > Upload > Upload presets
   - Crear preset con signing mode "Unsigned"
   - Carpeta de destino: `luluna/products`

### 5. Variables de Entorno

Completar el archivo `.env`:

```env
# Firebase
PUBLIC_FIREBASE_API_KEY=AIza...
PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your-project-id
PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Cloudinary
PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
PUBLIC_CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=your-secret
PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset

# Site
PUBLIC_SITE_URL=https://your-username.github.io/luluna-jewelry-catalog
PUBLIC_DEFAULT_LOCALE=es
```

## 🏗️ Arquitectura

### Estructura de Carpetas

```
src/
├── components/          # Componentes React
│   ├── catalog/        # Componentes del catálogo
│   ├── admin/          # Panel de administración
│   ├── common/         # Componentes compartidos
│   └── ui/             # Componentes UI base
├── services/           # Capa de lógica de negocio
│   ├── FirebaseClient.ts    # Cliente singleton
│   └── ProductService.ts    # Servicio de productos
├── repositories/       # Capa de acceso a datos
│   ├── IProductRepository.ts
│   └── ProductRepository.ts
├── types/              # Definiciones TypeScript
├── i18n/               # Internacionalización
│   ├── locales/
│   ├── config.ts
│   └── I18nContext.tsx
├── utils/              # Utilidades y hooks
├── layouts/            # Layouts de Astro
├── pages/              # Páginas (rutas)
└── styles/             # Estilos globales
```

### Flujo de Datos

```
Usuario → Astro Page → React Component → Hook (SWR) → Service → Repository → Firebase
                                          ↓
                                      Cloudinary (imágenes)
```

### Componentes Clave

#### Catálogo (`/catalog`)
- **CatalogView** - Vista principal del catálogo
- **ProductGrid** - Grid de productos
- **ProductCard** - Tarjeta individual de producto
- **CategoryFilter** - Filtros por categoría
- **SearchBar** - Búsqueda de productos

#### Admin (`/admin`)
- **AdminPanel** - Panel de administración
- **ProductForm** - Formulario de creación/edición

## 📦 Despliegue

### GitHub Pages (Recomendado)

1. **Configurar repositorio en GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/luluna-jewelry-catalog.git
git push -u origin main
```

2. **Actualizar `astro.config.mjs`**

```javascript
export default defineConfig({
  site: 'https://your-username.github.io',
  base: '/luluna-jewelry-catalog',
  // ...resto de configuración
});
```

3. **Configurar GitHub Secrets**

En GitHub: Settings > Secrets and variables > Actions

Agregar todos los secrets de `.env`:
- `PUBLIC_FIREBASE_API_KEY`
- `PUBLIC_FIREBASE_AUTH_DOMAIN`
- `PUBLIC_FIREBASE_PROJECT_ID`
- `PUBLIC_FIREBASE_STORAGE_BUCKET`
- `PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `PUBLIC_FIREBASE_APP_ID`
- `PUBLIC_CLOUDINARY_CLOUD_NAME`
- `PUBLIC_CLOUDINARY_API_KEY`
- `PUBLIC_CLOUDINARY_UPLOAD_PRESET`

4. **Habilitar GitHub Pages**

Settings > Pages > Source: GitHub Actions

5. **Push para desplegar**

```bash
git push origin main
```

GitHub Actions construirá y desplegará automáticamente.

### Netlify (Alternativa)

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod
```

Configurar variables de entorno en Netlify Dashboard.

## 🎨 Gestión de Productos

### Panel de Administración

Acceder a `/admin` para gestionar productos.

**Funcionalidades:**
- ✅ Crear productos nuevos
- ✅ Editar productos existentes
- ✅ Eliminar productos
- ✅ Publicar/despublicar (drafts)
- ✅ Subir múltiples imágenes
- ✅ Contenido multiidioma

### Crear Producto

1. Ir a `/admin`
2. Click en "Agregar producto"
3. Completar formulario en ambos idiomas
4. Subir imágenes (se optimizan automáticamente)
5. Seleccionar categoría
6. Marcar "Publicado" para hacerlo visible
7. Guardar

**Las actualizaciones se reflejan instantáneamente** en el catálogo sin necesidad de rebuild.

### Optimización de Imágenes

Las imágenes se suben a Cloudinary y se optimizan automáticamente:
- ✅ Conversión a WebP/AVIF
- ✅ Compresión inteligente
- ✅ Generación de thumbnails
- ✅ Lazy loading
- ✅ CDN global

## 🎯 Principios SOLID

Este proyecto implementa los principios SOLID:

### Single Responsibility Principle (SRP)
- Cada clase/componente tiene una única responsabilidad
- `ProductService` maneja lógica de negocio
- `ProductRepository` maneja acceso a datos
- Componentes UI solo manejan presentación

### Open/Closed Principle (OCP)
- Servicios extensibles mediante interfaces
- Nuevos tipos de productos sin modificar código existente
- Fácil agregar nuevos idiomas

### Liskov Substitution Principle (LSP)
- `ProductRepository` implementa `IProductRepository`
- Cualquier implementación de repositorio es intercambiable

### Interface Segregation Principle (ISP)
- Interfaces específicas y cohesivas
- Clientes no dependen de métodos que no usan

### Dependency Inversion Principle (DIP)
- Servicios dependen de abstracciones (interfaces)
- `ProductService` usa `IProductRepository`, no implementación concreta
- Inyección de dependencias en constructores

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview

# Linting
npm run lint

# Format código
npm run format
```

## 🔒 Seguridad

- ✅ Reglas de Firestore: Solo lectura pública de productos publicados
- ✅ Reglas de Storage: Solo lectura pública de imágenes
- ✅ Variables sensibles en secrets de GitHub
- ✅ Validación de datos con Zod
- ✅ Autenticación Firebase para admin

## 🌍 Internacionalización

### Agregar Nuevo Idioma

1. Crear archivo `src/i18n/locales/fr.json` (ejemplo francés)
2. Copiar estructura de `es.json` y traducir
3. Actualizar `src/i18n/config.ts`:

```typescript
export const locales: Locale[] = ['es', 'en', 'fr'];
```

4. Actualizar tipo en `src/types/i18n.ts`:

```typescript
export type Locale = 'es' | 'en' | 'fr';
```

5. Agregar campo en productos de Firestore

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto bajo licencia MIT.

## 🙏 Agradecimientos

- [Astro](https://astro.build) - Framework increíble
- [React](https://react.dev) - Biblioteca UI
- [Firebase](https://firebase.google.com) - Backend as a Service
- [Cloudinary](https://cloudinary.com) - Optimización de imágenes
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS

---

Hecho con ❤️ por LuLuna
