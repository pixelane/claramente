# Clara

Clara: cuentas claras.

PWA estatica para dividir gastos compartidos sin backend, sin base de datos remota y con costo de infraestructura $0.

## Estado actual

MVP local creado con HTML, CSS y JavaScript vanilla.

Incluye:

- Grupo y moneda.
- Participantes.
- Recordatorios simples de cobro por participante.
- Gastos generales.
- Modo restaurante con ticket por articulos.
- Asignacion de cada articulo a una o varias personas.
- Propina y cargos adicionales proporcionales.
- Parser local de texto de ticket.
- Calculo de saldos.
- Pagos sugeridos.
- Cierre de mesa con pendiente/saldado.
- Registro de monto entregado y cambio.
- Modo festejado/invitado con redistribucion entre quienes si pagan.
- Persistencia en `localStorage`.
- Compartir por URL hash.
- Cifrado local con dos modos:
  - Link facil: el link incluye datos cifrados y clave.
  - Modo privado: el link incluye datos cifrados y la clave se comparte aparte.
- Mensaje listo para WhatsApp con pendientes y recordatorios.
- Service worker basico para uso offline.

No incluye todavia:

- OCR integrado propio.
- IA.
- Backend.
- Login.
- Pasarela de pagos.

## Como abrir

Abre `index.html` en el navegador.

Tambien puedes servir la carpeta con cualquier servidor estatico local. No requiere instalacion de dependencias.

## Como dividir restaurante

En modo restaurante:

1. Pega texto del ticket o crea una cuenta vacia.
2. Agrega articulos y precios.
3. Marca quienes consumieron cada articulo.
4. Configura propina y cargos adicionales.
5. Guarda la cuenta.

Clara genera los pagos sugeridos y muestra `Cierre de mesa`.

## Cierre de mesa

Cada pago sugerido puede marcarse como saldado.

Tambien puedes escribir cuanto entrego cada persona:

- Si entrego exacto, queda saldado.
- Si entrego menos, aparece faltante.
- Si entrego mas, aparece cambio.

Abajo se muestra cuanto falta por juntar y quienes faltan por pagar.

## Festejado o invitado

En el cierre de mesa puedes marcar a una persona como festejada/invitada.

- Esa persona paga $0.
- Su parte original se reparte entre quienes si pagan.
- Si toda la mesa queda como festejada, Clara pide dejar al menos una persona que absorba la cuenta.

## Privacidad

El estado no se envia a un servidor de Clara. Vive en `localStorage` y, cuando se comparte, viaja dentro del hash de la URL.

La app no necesita cargar recursos externos para funcionar.

El modo Link facil es comodo: cualquiera con el link completo puede abrir el grupo.

El modo privado separa link y clave: quien tenga solo el link no puede leer los gastos.

Nota importante: el estado guardado en `localStorage` queda en claro dentro del navegador local. El cifrado aplica al link compartido, no al almacenamiento del dispositivo.

En modo privado, el mensaje para WhatsApp no incluye la clave. La clave se copia aparte para mandarla por otro canal.

## Deploy gratis

Puede publicarse en GitHub Pages, Cloudflare Pages, Netlify o Vercel como sitio estatico.

Para GitHub Pages:

1. Subir estos archivos a un repositorio.
2. Activar Pages desde la rama principal.
3. Abrir la URL publicada.

## Roadmap

- Exportar/importar JSON.
- Historial local de grupos.
- OCR local con Tesseract.js.
- Parser IA con llave del usuario.
