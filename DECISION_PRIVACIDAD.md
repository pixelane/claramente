# Decision de privacidad: el host elige

La app debe ofrecer dos modos de privacidad al crear o compartir un grupo.

## Link facil

El enlace incluye el estado cifrado y la clave necesaria para abrirlo.

Este modo es el mas comodo para WhatsApp o Telegram. Protege contra lectura casual del payload, evita base de datos centralizada y mantiene el hash fuera del servidor, pero cualquier persona con el link completo puede abrir el grupo.

## Modo privado

El enlace incluye solo el estado cifrado. La clave se muestra aparte para que el host la comparta por otro canal.

Este modo ofrece cifrado real: quien tenga solo el link no puede leer los gastos.

## Implementacion

Ambos modos mantienen costo $0 porque se ejecutan 100% en el navegador:

- `Web Crypto API` con `AES-GCM` para cifrado.
- `CompressionStream` para compresion local.
- `window.location.hash` para transportar el estado sin enviarlo al servidor.

El host decide el modo antes de compartir.
