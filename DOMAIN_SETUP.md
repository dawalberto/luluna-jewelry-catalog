# Configuración del Dominio lulunajoyas.com

## ✅ Cambios Realizados en el Proyecto

Se han actualizado los siguientes archivos para usar el dominio `lulunajoyas.com`:

1. **astro.config.mjs** - URL base del sitio
2. **.env.example** - Variable de entorno PUBLIC_SITE_URL
3. **public/robots.txt** - URL del sitemap
4. **public/favicon_io/site.webmanifest** - Nombre de la aplicación
5. **public/CNAME** - Archivo requerido por GitHub Pages

## 🌐 Configuración DNS

Para que el dominio funcione, necesitas configurar los registros DNS en tu proveedor de dominio:

### Paso 1: Configurar el Dominio Principal (OBLIGATORIO)

Añade estos 4 registros **A** en tu proveedor de DNS:

```
Host: @
Type: A
Value: 185.199.108.153

Host: @
Type: A
Value: 185.199.109.153

Host: @
Type: A
Value: 185.199.110.153

Host: @
Type: A
Value: 185.199.111.153
```

### Paso 2: Configurar el Subdominio www (OPCIONAL)

Si quieres que `www.lulunajoyas.com` también funcione y redirija a `lulunajoyas.com`, añade este registro **CNAME**:

```
Host: www
Type: CNAME
Value: dawalberto.github.io.
```

**Nota:** El punto al final de `dawalberto.github.io.` es importante en algunos proveedores de DNS.

### ⚠️ Sobre el error "www.lulunajoyas.com is improperly configured"

Si ves este mensaje en GitHub Pages:
- **Es normal si solo configuraste el dominio principal** (lulunajoyas.com)
- GitHub verifica automáticamente tanto `lulunajoyas.com` como `www.lulunajoyas.com`
- Si no necesitas el subdominio www, puedes ignorar este aviso
- Si quieres que ambos funcionen, configura el registro CNAME del Paso 2

## 📝 Configuración en GitHub

### 1. Actualizar Variables de Entorno en GitHub Secrets

Ve a tu repositorio en GitHub → Settings → Secrets and variables → Actions

Actualiza el secret:
- `PUBLIC_SITE_URL` = `https://lulunajoyas.com`

### 2. Configurar Custom Domain en GitHub Pages

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. En "Custom domain", ingresa: `lulunajoyas.com`
4. Marca la casilla "Enforce HTTPS" (esto puede tardar unos minutos en estar disponible)

## 🔄 Despliegue

Después de configurar el DNS y GitHub:

```bash
# Asegúrate de que tu archivo .env tenga la URL correcta
echo "PUBLIC_SITE_URL=https://lulunajoyas.com" >> .env

# Haz commit y push de los cambios
git add .
git commit -m "Configure custom domain lulunajoyas.com"
git push origin main
```

El workflow de GitHub Actions se ejecutará automáticamente y desplegará el sitio.

## ⏱️ Tiempo de Propagación

- **Registros DNS**: Pueden tardar de 5 minutos a 48 horas en propagarse completamente
- **Certificado HTTPS**: GitHub lo genera automáticamente (puede tardar hasta 1 hora)

## ✅ Verificación

Para verificar que todo funciona:

1. **DNS Propagación**: Usa [whatsmydns.net](https://www.whatsmydns.net/) para verificar que los registros DNS se hayan propagado
2. **Sitio Web**: Visita `https://lulunajoyas.com` después de la propagación
3. **HTTPS**: Verifica que el candado verde aparezca en el navegador

## 🔍 Solución de Problemas

### El dominio no resuelve
- Verifica que los registros DNS estén correctamente configurados
- Espera más tiempo (la propagación puede tardar hasta 48 horas)

### Error de certificado HTTPS
- Asegúrate de que "Enforce HTTPS" esté marcado en GitHub Pages
- El certificado puede tardar hasta 1 hora en generarse

### El sitio muestra 404
- Verifica que el archivo CNAME esté en `/public/CNAME`
- Asegúrate de que el deploy se haya completado correctamente
- Revisa que la configuración en GitHub Pages → Custom Domain esté correcta

## 📚 Referencias

- [GitHub Pages - Configurar dominio personalizado](https://docs.github.com/es/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Astro - Desplegar en GitHub Pages](https://docs.astro.build/es/guides/deploy/github/)
