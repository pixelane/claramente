# Handoff Anty - Clara MVP publicado

Fecha: 2026-06-05

## Estado actual

Clara ya esta publicada en GitHub personal:

- Repo: https://github.com/pixelane/clara
- App publica: https://pixelane.github.io/clara/
- Tests tecnicos: https://pixelane.github.io/clara/test.html
- Rama Pages: `main`, path `/`
- Cache actual: historico `clara-cache-v10`; runtime actual `clara-cache-v19`

## Ultimos cambios hechos por Codex

1. Se corrigio el descuadre de la vista movil en `Liquidacion`.
   - La barra inferior ya no genera overflow horizontal en `?mode=mobile`.
   - Los radios invisibles de `Link facil / Modo privado` ya no heredan `width: 100%`.
   - Las filas de saldos/pagos sugeridos ahora permiten wrapping sin empujar el panel.
   - El cierre de mesa usa layout mas estable en pantallas menores a 480px.

2. Se copio el cambio a XAMPP local:
   - Ruta local servida: `C:\xampp\htdocs\clara`
   - URL local: http://127.0.0.1/clara/

3. Se hizo commit y push:
   - Commit: `cae1677 fix: Keep settlement view aligned on mobile`
   - Repo remoto: `origin https://github.com/pixelane/clara.git`

## Validaciones ya hechas

- `node --check app.js`
- `node --check sw.js`
- Revision de mojibake/cache viejo:
  - sin `clara-cache-v9`
  - sin caracteres rotos detectados por `rg`
- Prueba automatizada mobile con Chrome/Playwright:
  - viewport: `390x844`
  - resultado antes: `overflow: 204`
  - resultado despues: `overflow: 0`
  - elementos fuera del viewport: `[]`
- GitHub Pages responde:
  - `/` => `200 OK`
  - `/sw.js` contenia `clara-cache-v10` en esa revision historica

## Herramientas necesarias para continuar

No hace falta instalar nada si se trabaja desde este entorno. Ya se uso:

- Git
- GitHub CLI (`gh`)
- Node incluido en Codex:
  - `C:\Users\luisc\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`
- Playwright disponible en el runtime de Codex, usando `NODE_PATH`:
  - `C:\Users\luisc\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules`
  - `C:\Users\luisc\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\.pnpm\playwright-core@1.60.0\node_modules`
- Chrome local para pruebas Playwright:
  - `C:\Program Files\Google\Chrome\Application\chrome.exe`
- XAMPP/Apache para pruebas locales:
  - `C:\xampp`

## Cuenta GitHub activa

`gh` quedo autenticado con:

- Activa: `pixelane`
- Inactiva guardada: `darlina-bounty-codex`

Si el push falla por credenciales, correr:

```powershell
gh auth status
gh auth switch -u pixelane
gh auth setup-git -h github.com
git push
```

## Siguiente recomendacion para Anty

1. Abrir https://pixelane.github.io/clara/?mode=mobile en celular o emulador.
2. Probar un caso real de restaurante:
   - 4 personas
   - 1 festejado
   - 1 pagador
   - propina 10%
   - billete entregado mayor al monto
3. Revisar que en `Liquidacion` no haya scroll lateral y que el cierre de mesa se entienda.
4. Si hay ajustes, cambiar local primero, validar, subir cache sobre la version vigente, commit y push a `main`.
