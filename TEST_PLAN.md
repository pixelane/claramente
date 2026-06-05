# Test plan manual

## Flujo base

1. Abrir `index.html`.
2. Confirmar que la marca visible dice `Clara` y `Clara: cuentas claras.`
3. Confirmar que no hay selector de tema.
4. Escribir nombre de grupo.
5. Agregar participantes: Ana, Luis, Maria.
6. Recargar la pagina.
7. Confirmar que el grupo y participantes siguen ahi.

## Recordatorios

1. En Ana, abrir `Agregar recordatorio`.
2. Guardar `Transferencia BBVA terminacion 1234`.
3. Confirmar que Ana muestra `Recordatorio listo`.
4. Generar mensaje de WhatsApp con un pago hacia Ana.
5. Confirmar que el mensaje incluye el recordatorio.

## Gastos generales

1. Abrir `Agregar un gasto general`.
2. Agregar gasto `Cena` de 100 pagado por Ana dividido entre Ana y Luis.
3. Confirmar que Luis paga 50 a Ana.
4. Eliminar el gasto.
5. Confirmar que saldos y cierre cambian.

## Restaurante

1. Agregar participantes: Ana, Luis, Maria.
2. Abrir `Modo restaurante`.
3. Crear cuenta vacia.
4. Probar propina `Sin propina`, `5%`, `10%` y `15%`.
5. Confirmar que el total calculado cambia con cada opcion.
6. Agregar articulos:
   - Tacos 100 asignado a Luis.
   - Pizza 100 asignado a Ana y Luis.
   - Agua 60 asignado a Maria.
7. Elegir que Ana pago la cuenta.
8. Guardar y dividir.
9. Confirmar pagos sugeridos por persona.

## Cierre de mesa

1. Con pagos sugeridos visibles, confirmar que aparece `Cierre de mesa`.
2. Confirmar que `Falta por juntar` suma los pagos pendientes.
3. Marcar un pago como saldado.
4. Confirmar que el faltante baja.
5. Desmarcarlo.
6. Confirmar que vuelve a pendiente.

## Billetes grandes y cambio

1. En un pago de 300, escribir `500` en `Entrego`.
2. Confirmar que aparece cambio de 200.
3. En un pago de 300, escribir `100`.
4. Confirmar que aparece faltante de 200.
5. Confirmar que el cambio total y faltante total cuadran.

## Festejado / invitado

1. En cierre de mesa, marcar a Luis como `Festejado / invitado`.
2. Confirmar que Luis queda como festejado y no aparece como pendiente.
3. Confirmar que la parte original de Luis se reparte entre quienes si pagan.
4. Desmarcar a Luis.
5. Confirmar que los montos vuelven al estado anterior.
6. Marcar a todos como festejados.
7. Confirmar que aparece aviso para dejar al menos una persona que absorba la cuenta.

## Compartir

1. Elegir Link facil.
2. Copiar link.
3. Abrir el link en otra pestana.
4. Confirmar que restaura el grupo.
5. Elegir Modo privado.
6. Copiar link y clave.
7. Abrir link privado sin clave.
8. Confirmar que pide clave.
9. Probar clave incorrecta.
10. Probar clave correcta.

## WhatsApp

1. Con gastos registrados, copiar mensaje de WhatsApp.
2. Pegar en un editor.
3. Confirmar que incluye pagos sugeridos, pendientes de cierre y link.
4. En modo privado, confirmar que no incluye la clave.
5. Usar el boton `Copiar clave` para copiarla por separado.

## Responsive

1. Probar ancho movil cercano a 360 px.
2. Confirmar que no hay texto encimado.
3. Confirmar que botones y formularios son tocables.
4. Confirmar que la tabla del ticket se puede usar sin romper el layout.

## Tecnico

1. Abrir consola del navegador.
2. Confirmar que no hay errores persistentes.
3. Confirmar que no hay llamadas a servidores externos.
4. Confirmar que la app abre sin instalar dependencias.
5. Confirmar que `app.js` y `sw.js` pasan revision de sintaxis.
