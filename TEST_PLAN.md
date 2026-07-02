# Test plan manual

## Participantes

1. Abrir `index.html`.
2. Confirmar que la marca visible dice `Clara`.
3. Confirmar que hay 3 tabs: `Grupo`, `Gastos`, `Pagos`.
4. Confirmar que Soporte abre desde el boton `?`.
5. Agregar Ana, Luis y Maria.
6. Editar el nombre de Luis inline y guardar con Enter o blur.
7. Intentar duplicar un nombre y confirmar que se bloquea.

## Cumpleanero o invitado

1. Con participantes creados, confirmar que aparece la seccion de cumpleanero/invitado.
2. Marcar Maria.
3. Confirmar que queda destacada.
4. Desmarcar Maria.
5. Con dos personas y Maria marcada, confirmar que un platillo compartido no deja a Maria con pago pendiente.

## Dividir por platillo

1. Ir a `Gastos`.
2. Abrir `Dividir por platillo`.
3. Confirmar que `Quien pago la cuenta` inicia en `Nadie (pago al momento)`.
4. Agregar productos:
   - Tacos 100 para Luis.
   - Pizza 100 para Ana y Luis.
   - Agua 60 para Maria.
5. Probar propina `Sin propina`, `5%`, `10%` y `15%`.
6. Guardar y dividir.

## Pagos cuando nadie pago

1. Ir a `Pagos`.
2. Confirmar que aparece una fila por persona que aporta.
3. Confirmar que el faltante total coincide con el total calculado.
4. En un aporte de 300, escribir `500` en `Entrego`.
5. Confirmar que aparece cambio de 200.
6. Marcar un aporte como cubierto y confirmar que baja el faltante.

## Pagos cuando alguien pago

1. Crear otra cuenta por platillo.
2. Elegir que Ana pago la cuenta.
3. Confirmar que Luis/Maria pagan a Ana.
4. Confirmar que Ana aparece una sola vez como aporte propio aunque haya pagado varias cuentas.

## Gastos compartidos

1. Abrir `Agregar gasto compartido`.
2. Agregar `Taxi` de 300 pagado por Ana y dividido entre todos.
3. Editar descripcion y monto inline.
4. Quitar el gasto y confirmar que pide confirmacion.

## Compartir

1. Con gastos registrados, copiar resumen para WhatsApp.
2. Pegar en un editor.
3. Confirmar que incluye pagos, aportes, faltantes y link.
4. Copiar link y abrirlo en otra pestana.
5. Confirmar que restaura el grupo.
6. Confirmar que la barra de direcciones queda sin hash despues de importar.
7. Recargar la pestana importada y confirmar que no vuelve a pedir importar el mismo link.

## Responsive y tecnico

1. Probar ancho movil cercano a 360 px.
2. Confirmar que no hay scroll lateral.
3. Confirmar que los chips de productos son tocables.
4. Confirmar que no hay errores persistentes en consola.
5. Confirmar que `app.js` y `sw.js` pasan `node --check`.
6. En Ayuda, confirmar que la version de cache visible coincide con la version vigente en `index.html`, `app.js`, `claramente.js` y `sw.js`.
7. Abrir la app una segunda vez y confirmar que no aparece una version vieja antes de recargar.

## Seguridad estatica

1. Confirmar que `index.html` incluye una politica CSP sin scripts externos.
2. Confirmar que el modulo OCR no aparece en el modal de platillos.
3. Importar una copia `.clara` valida y confirmar que carga normal.
4. Intentar importar un archivo mayor a 350 KB y confirmar que se rechaza.
5. Abrir un link compartido excesivamente largo y confirmar que la app lo limpia sin cargarlo.
