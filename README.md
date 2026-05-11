# Lista de la compra PWA

PWA sencilla para móvil conectada a Supabase. Permite añadir productos, filtrarlos por categoría, marcarlos como comprados y borrarlos.

La app clasifica automáticamente los productos usando el catálogo local `category-catalog.js`, inspirado en secciones habituales de Carrefour y Mercadona. También corrige productos que lleguen desde Alexa/n8n como `Otros` cuando puede reconocer la categoría.

## Uso local

Abre la carpeta con un servidor local. Por ejemplo:

```powershell
node local-server.mjs
```

Después entra en `http://127.0.0.1:8080/`.

## Publicar en GitHub Pages

1. Sube esta carpeta a un repositorio de GitHub.
2. En GitHub, ve a `Settings > Pages`.
3. Elige la rama principal y la carpeta raíz del proyecto.
4. Abre la URL pública desde el móvil.
5. En Chrome o Edge, usa `Añadir a pantalla de inicio`.

## Importante

La tabla `shopping_list` tiene RLS desactivado. Eso significa que cualquiera que tenga la URL publicada podría leer o modificar la lista. Para uso familiar puede servir como prueba, pero conviene activar RLS o añadir autenticación antes de compartirla ampliamente.
