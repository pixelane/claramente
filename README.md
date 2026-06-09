# Clara

Clara divide cuentas de mesa y gastos compartidos desde una PWA estatica. No usa backend, login, base de datos remota ni recursos externos.

## Que hace

- Agrega participantes.
- Divide productos por consumo.
- Agrega gastos compartidos.
- Calcula pagos y aportes por persona.
- Permite juntar dinero al momento con `Nadie (pago al momento)` como opcion por defecto.
- Maneja cumpleanero o invitado: quien no paga queda en $0 y su parte se reparte entre los demas.
- Registra cuanto entrego cada persona y calcula faltantes o cambio.
- Copia resumen para WhatsApp.
- Copia link del grupo.
- Guarda datos en `localStorage`.
- Exporta e importa copia local `.clara`.

## Como abrir

Abre `index.html` directamente o sirve la carpeta con cualquier servidor estatico.

Ejemplo local:

```powershell
python -m http.server 8000
```

Luego abre `http://localhost:8000`.

## Flujo recomendado

1. Agrega participantes.
2. Si alguien es cumpleanero o invitado y no va a pagar, marcalo en Grupo.
3. En Gastos, usa `Dividir por platillo` para capturar productos manualmente.
4. Si algo se divide por igual, usa `Agregar gasto compartido`.
5. Revisa `Pagos` para saber cuanto aporta cada quien.
6. Copia el resumen para WhatsApp.

## Privacidad

El estado vive en el navegador. Cuando copias un link, los datos necesarios para abrir el grupo viajan en la URL. Compartelo solo con quienes participan en la cuenta.

Cuando Clara abre un grupo desde un link compartido, limpia el hash de la barra de direcciones para evitar que alguien vuelva a copiar accidentalmente el payload del enlace desde la URL visible.

La app conserva compatibilidad para abrir links privados antiguos, pero la interfaz v1 ya no genera nuevos links privados.

## Publicacion gratis

Puede publicarse en GitHub Pages, Cloudflare Pages, Netlify o Vercel como sitio estatico.

Para GitHub Pages:

1. Subir estos archivos al repo.
2. Activar Pages desde la rama principal.
3. Elegir `/` como carpeta publicada.

## No incluido en v1

- IA.
- Login o sincronizacion.
- Pagos reales.
- Backend.
