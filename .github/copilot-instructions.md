# LuLuna Jewelry Catalog - Copilot Instructions

## Project Overview
Headless jewelry catalog built with Astro + React + Firebase for fast, maintainable product display with real-time updates without rebuilds.

**Stack:** Astro 4.x, React 18, TypeScript, Firebase (Firestore + Storage), Tailwind CSS, SWR, Cloudinary
**Deployment:** GitHub Pages (primary), Netlify/Vercel (fallback)
**Languages:** Spanish (default), English, extensible i18n

## Architecture Principles

### SOLID Implementation
- **Single Responsibility:** Each service/component has one clear purpose
- **Open/Closed:** Services extensible via interfaces, closed for modification
- **Liskov Substitution:** All repositories implement common interfaces
- **Interface Segregation:** Separate interfaces for read/write operations
- **Dependency Inversion:** Depend on abstractions (interfaces), not concrete implementations

### Layer Separation
```
src/
├── components/       # React components (presentation)
├── services/         # Business logic (ProductService, FirebaseClient)
├── repositories/     # Data access (ProductRepository)
├── types/            # TypeScript interfaces and types
├── layouts/          # Astro layouts
├── pages/            # Astro pages (routing)
├── i18n/             # Internationalization files
└── styles/           # Global styles and Tailwind config
```

## Development Guidelines

### Component Development
- Use TypeScript for all components with explicit interfaces
- React components: Functional with hooks, avoid class components
- Astro components: Use for static layouts and page shells
- Islands architecture: Hydrate only interactive components with \`client:load\` or \`client:visible\`

### Data Fetching
- **Client-side only:** All product data fetched via SWR from Firebase
- No SSR/SSG for product data (enables real-time updates)
- SWR configuration: revalidate on focus, dedupe requests, cache responses
- Firestore queries: Use pagination, limit results, index appropriately

### Styling Guidelines
- **Tailwind utility classes** for component styling
- **Design tokens:**
  - Accent: \`#2E6A77\` (teal)
  - Pastels: soft pink (#F9E5E5), mint (#E5F9F0), lavender (#F0E5F9), peach (#FFE5CC)
  - Typography: Playfair Display (headings), Inter (body)
  - Spacing: 4px base unit, consistent use of Tailwind spacing scale
- Responsive: Mobile-first, breakpoints at sm (640), md (768), lg (1024), xl (1280)

### Firebase Schema
\`\`\`typescript
// Firestore: products collection
interface Product {
  id: string;
  title: { es: string; en: string };
  description: { es: string; en: string };
  price: number;
  category: string;
  images: string[]; // Cloudinary URLs
  createdAt: Timestamp;
  updatedAt: Timestamp;
  published: boolean;
}
\`\`\`

### i18n Implementation
- Spanish as default locale
- Translation files in \`src/i18n/locales/{lang}.json\`
- Use context provider for language switching
- All user-facing text must be translatable
- Product content stored in multilingual format in Firestore

### Security
- Firestore rules: Public read-only access to published products
- Admin routes: Protected with Firebase Auth
- Environment variables: Never commit \`.env\`, use \`.env.example\` template
- Image uploads: Validate file types, size limits in admin panel

### Image Optimization
- Use Cloudinary for all product images
- Transformations: Auto-format (WebP/AVIF), auto-quality, responsive sizes
- Lazy loading: Native \`loading="lazy"\` attribute
- Aspect ratio: Maintain 4:3 for product cards, allow flexible in galleries

### Admin Panel
- Separate route: \`/admin\` (not in main catalog navigation)
- Simple CRUD interface for non-technical users
- Firebase Auth for access control
- Image upload directly to Cloudinary with signed uploads
- Real-time preview before publishing

### Testing & Quality
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Validate all Firebase data with Zod schemas before rendering
- Handle loading and error states gracefully

## Common Tasks

### Adding a New Component
1. Create in \`src/components/\` with TypeScript interface
2. Follow naming: PascalCase for files, descriptive names
3. Export as default for Astro compatibility
4. Add props interface with JSDoc comments
5. Implement responsive design with Tailwind

### Adding a New Language
1. Create \`src/i18n/locales/{lang}.json\` with all keys
2. Update \`src/i18n/config.ts\` with new locale
3. Add language selector option in UI
4. Test all pages with new language

### Deploying Updates
1. Push to \`main\` branch triggers GitHub Actions
2. Build static site with \`npm run build\`
3. Deploy \`dist/\` to GitHub Pages
4. Product updates happen live via Firebase (no rebuild needed)

### Updating Products
- Use admin panel at \`/admin\` route
- Changes reflect immediately for all users
- Images automatically optimized via Cloudinary

## Key Dependencies
- \`astro\` - Static site framework
- \`react\` & \`react-dom\` - UI library
- \`firebase\` - Backend services
- \`swr\` - Data fetching and caching
- \`cloudinary\` - Image optimization
- \`tailwindcss\` - Styling
- \`@astrojs/react\` - React integration for Astro
- \`zod\` - Runtime validation

## Project Status
✅ All core features implemented
✅ Ready for deployment
✅ Documentation complete
