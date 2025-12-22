# 🚀 LuLuna - Referencia Rápida

## 📋 Comandos Esenciales

```bash
# Verificar estado del proyecto
./check-project.sh

# Inicio rápido guiado
./quick-start.sh

# Desarrollo
npm run dev              # http://localhost:4321

# Build
npm run build

# Preview
npm run preview
```

---

## 📁 Estructura Simplificada

```
src/
├── pages/              # Rutas
│   ├── index.astro    → /
│   ├── catalog.astro  → /catalog
│   └── admin.astro    → /admin
│
├── components/
│   ├── catalog/       # ProductCard, ProductGrid, SearchBar, etc.
│   ├── admin/         # AdminPanel, ProductForm
│   ├── common/        # Header, Footer, LanguageSwitcher
│   └── ui/            # Button, Input, LoadingSpinner
│
├── services/          # Lógica de negocio
│   ├── FirebaseClient.ts
│   └── ProductService.ts
│
├── repositories/      # Acceso a datos
│   └── ProductRepository.ts
│
└── i18n/             # Traducciones (es/en)
    └── locales/
```

---

## 🔧 Configuración Inicial

### 1. Node.js (IMPORTANTE)
```bash
# Requiere Node.js >= 18.20.8
node --version

# Actualizar con nvm
nvm install 20 && nvm use 20

# O con Homebrew
brew install node@20
```

### 2. Variables de Entorno
```bash
cp .env.example .env
# Editar .env con credenciales de Firebase y Cloudinary
```

### 3. Firebase
```bash
# Instalar CLI
npm install -g firebase-tools

# Login y configurar
firebase login
firebase init

# Desplegar reglas
firebase deploy --only firestore:rules,storage:rules
```

---

## 🎨 Diseño

### Colores
- **Primary**: `#2E6A77` (Teal)
- **Pastel Pink**: `#F9E5E5`
- **Pastel Mint**: `#E5F9F0`
- **Pastel Lavender**: `#F0E5F9`
- **Pastel Peach**: `#FFE5CC`

### Tipografía
- **Headings**: Playfair Display
- **Body**: Inter

---

## 📊 Schema de Producto (Firestore)

```typescript
{
  id: string,
  title: {
    es: "Anillo de Plata",
    en: "Silver Ring"
  },
  description: {
    es: "Descripción en español",
    en: "Description in English"
  },
  price: 45.99,
  category: "rings" | "necklaces" | "bracelets" | "earrings" | "sets" | "custom",
  images: ["https://...cloudinary.../image1.jpg"],
  published: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🔒 Seguridad

### Firestore Rules
- ✅ Lectura pública: Solo productos con `published: true`
- 🔐 Escritura: Solo usuarios autenticados

### Storage Rules
- ✅ Lectura pública: Todas las imágenes
- 🔐 Escritura: Solo usuarios autenticados + validación de tamaño

---

## 🌍 i18n (Internacionalización)

### Agregar nuevo idioma

1. Crear `src/i18n/locales/fr.json`
2. Actualizar `src/i18n/config.ts`:
   ```typescript
   export const locales: Locale[] = ['es', 'en', 'fr'];
   ```
3. Actualizar `src/types/i18n.ts`:
   ```typescript
   export type Locale = 'es' | 'en' | 'fr';
   ```

---

## 🚀 Deployment

### GitHub Pages (Recomendado)

1. **Actualizar `astro.config.mjs`**:
   ```javascript
   site: 'https://TU-USUARIO.github.io',
   base: '/luluna-jewelry-catalog',
   ```

2. **GitHub Secrets** (Settings > Secrets):
   - Agregar todas las variables de `.env`

3. **Push y Deploy**:
   ```bash
   git push origin main
   # GitHub Actions hace el deploy automáticamente
   ```

### Netlify
```bash
npm run build
netlify deploy --prod
```

### Vercel
```bash
npm run build
vercel --prod
```

---

## 📚 Hooks Personalizados (SWR)

```typescript
// Obtener todos los productos
const { products, isLoading } = useProducts(filters, pagination);

// Obtener un producto por ID
const { product, isLoading } = useProduct(id);

// Buscar productos
const { products } = useProductSearch(query);

// Por categoría
const { products } = useProductsByCategory(category);
```

---

## 🎯 Componentes Principales

### Catálogo
```tsx
<CatalogView />           // Vista completa del catálogo
<ProductGrid />           // Grid de productos
<ProductCard />           // Tarjeta individual
<CategoryFilter />        // Filtros de categoría
<SearchBar />             // Barra de búsqueda
<ProductGallery />        // Galería de imágenes
```

### Admin
```tsx
<AdminPanel />            // Panel completo
<ProductForm />           // Formulario crear/editar
```

### Comunes
```tsx
<Header />                // Cabecera con navegación
<Footer />                // Pie de página
<LanguageSwitcher />      // Cambio de idioma
```

---

## 🛠️ Utilidades

### Cloudinary
```typescript
// Obtener URL optimizada
getCloudinaryUrl(publicId, {
  width: 400,
  height: 500,
  quality: 'auto',
  format: 'auto'
});

// Srcset responsive
getResponsiveSrcSet(publicId, [320, 640, 1024]);

// Placeholder blur
getPlaceholderUrl(publicId);
```

---

## 🐛 Troubleshooting

### Error: Module not found
```bash
rm -rf node_modules package-lock.json .astro
npm install
```

### Error: Firebase not configured
```bash
# Verificar .env
cat .env | grep FIREBASE
# Asegúrate de que no contenga valores por defecto
```

### Error: Imágenes no cargan
```bash
# Verificar Cloudinary
cat .env | grep CLOUDINARY
# Verificar que el upload preset sea "unsigned"
```

### Build falla
```bash
# Limpiar caché
rm -rf .astro dist
npm run build
```

---

## 📖 Documentación Completa

- **README.md** → Documentación detallada completa
- **SETUP.md** → Guía paso a paso de configuración
- **PROJECT_SUMMARY.md** → Resumen técnico del proyecto
- **Este archivo** → Referencia rápida

---

## ✅ Checklist Pre-Deploy

- [ ] Node.js >= 18.20.8
- [ ] `.env` configurado con credenciales reales
- [ ] Firebase proyecto creado y configurado
- [ ] Firestore habilitado
- [ ] Storage habilitado
- [ ] Auth habilitado (Email/Password)
- [ ] Reglas de Firestore desplegadas
- [ ] Reglas de Storage desplegadas
- [ ] Cloudinary cuenta creada
- [ ] Upload preset unsigned creado
- [ ] `npm run build` exitoso
- [ ] GitHub Secrets configurados
- [ ] `astro.config.mjs` actualizado con site y base

---

## 🎓 Principios SOLID Aplicados

| Principio | Implementación |
|-----------|----------------|
| **S**ingle Responsibility | Cada clase/componente una sola responsabilidad |
| **O**pen/Closed | Extensible sin modificar código existente |
| **L**iskov Substitution | Interfaces intercambiables |
| **I**nterface Segregation | Interfaces específicas y cohesivas |
| **D**ependency Inversion | Depender de abstracciones, no implementaciones |

---

## �� Tips

### Performance
- Usa `client:visible` para componentes below the fold
- Lazy load imágenes con `loading="lazy"`
- SWR cachea automáticamente las requests

### SEO
- Actualiza meta descriptions en cada página
- Usa alt text descriptivos en imágenes
- Implementa Open Graph tags

### Mantenimiento
- Ejecuta `./check-project.sh` regularmente
- Mantén dependencias actualizadas
- Revisa Firebase Console periódicamente

---

**¿Necesitas ayuda?** Revisa la documentación completa en README.md
