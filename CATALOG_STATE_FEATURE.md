# Funcionalidad de Persistencia del Estado del Catálogo

## Descripción

Se ha implementado una nueva funcionalidad que mantiene el estado del catálogo cuando el usuario navega desde la vista del catálogo al detalle de un producto y luego regresa. Esta mejora proporciona una mejor experiencia de usuario al preservar:

- **Posición del scroll**: El usuario vuelve exactamente al punto donde estaba navegando
- **Filtros de categoría**: Se mantiene la categoría seleccionada
- **Búsqueda activa**: Se preserva el texto de búsqueda ingresado
- **Ordenamiento de precios**: Se mantiene el orden seleccionado (ascendente/descendente)

## Implementación Técnica

### Archivos Creados

1. **`src/utils/catalogState.ts`**
   - Funciones para guardar, cargar y limpiar el estado del catálogo
   - Almacena los datos en `localStorage`
   - Incluye validación de expiración (30 minutos)
   - Compatible con SSR (Server-Side Rendering)

### Archivos Modificados

1. **`src/components/catalog/CatalogView.tsx`**
   - Carga el estado guardado al montar el componente
   - Restaura filtros, búsqueda y ordenamiento
   - Restaura la posición del scroll después de cargar los productos
   - Pasa el estado actual a `ProductGrid` para guardarlo al navegar

2. **`src/components/catalog/ProductGrid.tsx`**
   - Recibe el estado actual del catálogo como prop
   - Guarda el estado en `localStorage` cuando se hace clic en un producto
   - Captura la posición del scroll actual antes de navegar

3. **`src/utils/index.ts`**
   - Exporta las funciones de gestión de estado del catálogo

## Flujo de Funcionamiento

1. **Navegación al detalle del producto**:
   - El usuario hace clic en una tarjeta de producto
   - `ProductGrid` captura el estado actual (filtros, búsqueda, orden, scroll)
   - Se guarda en `localStorage` con una marca de tiempo
   - El navegador navega a la página del producto

2. **Regreso al catálogo**:
   - `CatalogView` se monta y verifica si hay estado guardado
   - Si existe y no ha expirado (< 30 min), restaura:
     - Filtro de categoría
     - Texto de búsqueda
     - Orden de precios
   - Después de cargar los productos, restaura la posición del scroll

3. **Expiración del estado**:
   - El estado se limpia automáticamente después de 30 minutos
   - Esto evita restaurar estados obsoletos en sesiones futuras

## Características Técnicas

- **SSR Compatible**: Verifica la disponibilidad de `localStorage` antes de usarlo
- **Manejo de errores**: Try-catch en todas las operaciones de localStorage
- **Performance**: Usa `setTimeout` para restaurar el scroll después de que el DOM esté renderizado
- **No bloquea**: El estado guardado es opcional y no interfiere si falla

## Uso

La funcionalidad es completamente automática y no requiere intervención del usuario. Simplemente:

1. Navega por el catálogo, aplica filtros, busca productos, ordena por precio
2. Haz scroll para ver más productos
3. Haz clic en un producto para ver sus detalles
4. Usa el botón "Volver al catálogo" o el navegador
5. El catálogo se restaurará exactamente como lo dejaste

## Consideraciones

- El estado se mantiene durante 30 minutos
- Solo funciona en navegadores con soporte de `localStorage`
- El estado se guarda por sesión del navegador
- Si el usuario navega directamente a `/catalog` (sin venir del detalle), el catálogo se muestra en su estado inicial
