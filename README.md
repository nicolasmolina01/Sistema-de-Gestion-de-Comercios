# Kiosco La Esquina — Deploy en GitHub Pages

Este proyecto es una app estática (HTML, CSS y JS) y puede publicarse en GitHub Pages fácilmente.

## Opción recomendada: GitHub Actions (automático)

Ya incluye un workflow (`.github/workflows/pages.yml`) que despliega a GitHub Pages en cada push a `main`.

### Pasos
- Crear un repositorio en GitHub (por ejemplo `kiosco-la-esquina`).
- Inicializar y subir el código:
  1. `git init`
  2. `git add .`
  3. `git commit -m "Inicial"`
  4. `git branch -M main`
  5. `git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git`
  6. `git push -u origin main`
- En GitHub: ir a `Settings → Pages → Build and deployment` y elegir `Source: GitHub Actions`.
- Esperar a que termine el workflow en `Actions` y abrir la URL publicada (aparece en `Settings → Pages`).

## Opción alternativa: Deploy desde rama

- En `Settings → Pages`: `Source: Deploy from a branch`, elige `Branch: main` y `Folder: / (root)`.
- `Save`. GitHub generará la página en unos minutos.

## Notas

- Las rutas de los archivos (`index.html`, `app.js`, `styles.css`) son relativas y funcionan en `https://<usuario>.github.io/<repo>/`.
- Si usas dominio propio, añade un archivo `CNAME` en la raíz con tu dominio y configura DNS (registro CNAME apuntando a `<usuario>.github.io`).
- `localStorage` y ventanas de impresión funcionan en GitHub Pages. Algunas ventanas emergentes pueden requerir interacción del usuario.