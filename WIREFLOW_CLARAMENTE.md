# Wireflow: claramente

## 1. Lenguaje y glosario

Usar siempre:

- `Personas`
- `Cuenta`
- `Quien comio esto`
- `Quien pago`
- `De quien es`
- `Producto`
- `Gasto para todos`
- `Gasto de una persona`

No usar:

- `Participantes`
- `Usuarios`
- `Payload`
- `Settlement`
- `Grupo` como concepto principal
- `Consumidores`
- `Asignacion`
- `Acreedor`
- `Payer`
- `Item`
- `Split`

## 2. Reglas globales

### Claridad

- Cada pantalla tiene una pregunta dominante.
- La accion principal siempre indica que hacer ahora.
- Los textos de ayuda son cortos y concretos.
- Las opciones avanzadas no aparecen en el camino principal.

### Avance

- No se puede avanzar si el campo principal esta vacio o sin asignar.
- Los botones deshabilitados deben explicar que falta.
- La persona debe poder completar el flujo sin usar atajos secundarios.

### Errores

Los errores se muestran debajo del campo o seccion correspondiente.

Ejemplos:

- `Falta el nombre`
- `Ponle un precio`
- `Elige quien comio esto`
- `Agrega al menos a dos personas para dividir`

No usar mensajes tecnicos.

### Correccion

Todo dato importante debe poder editarse:

- Nombre de persona.
- Nombre de producto.
- Precio.
- Quien comio un producto.
- Nombre de gasto.
- Monto de gasto.
- De quien es un gasto individual.
- Quien pago.

Patron:

- Cada tarjeta tiene `Editar`.
- Algunas tarjetas tambien tienen `Duplicar` o `Quitar`.
- `Editar` abre un panel inferior.
- El panel tiene titulo humano, campo editable, `Guardar cambios` y, cuando aplica, `Eliminar`.
- Al guardar, cerrar el panel y mostrar una confirmacion breve: `Listo, se actualizo`.

### Mas opciones

Ocultar aqui:

- Moneda.
- Nombre de la cuenta.
- Propina inicial.
- Cargos extra.
- Exportar o importar copia.
- Compartir link.
- Diagnostico.

## 3. Componentes base

### Tarjeta de persona

Contenido:

- Nombre grande.
- Boton `Editar`.
- Boton `Quitar`.

Comportamiento:

- `Editar` abre `Editar persona`.
- `Quitar` pide confirmar: `Quitar a esta persona?`
- Si la persona ya esta usada en productos o pagos, explicar antes de bloquear o pedir confirmacion.

### Tarjeta de producto

Contenido:

- Nombre del producto.
- Precio.
- Texto: `Lo comieron: Ana, Luis`
- Botones: `Editar`, `Duplicar`, `Quitar`.

Comportamiento:

- Si nadie esta asignado, mostrar aviso: `Elige quien comio esto`.
- `Duplicar` crea otro producto con el mismo nombre, precio y personas.
- `Editar` abre `Editar producto`.

### Tarjeta de gasto para todos

Contenido:

- Nombre del gasto.
- Monto.
- Etiqueta: `Se divide entre todos`.
- Boton `Editar`.

Comportamiento:

- Por defecto incluye a todas las personas que pagan.
- Desde editar se puede cambiar quienes participan.

### Tarjeta de gasto de una persona

Contenido:

- Nombre del gasto.
- Monto.
- Etiqueta: `De: Ana`.
- Etiqueta: `Pago: Luis`.
- Boton `Editar`.

Comportamiento:

- Debe diferenciar claramente `De quien es` de `Quien pago`.

### Panel inferior de edicion

Forma:

- Ocupa media pantalla o casi toda en celular pequeno.
- Tiene titulo claro.
- Tiene controles grandes.
- Boton principal: `Guardar cambios`.
- Boton destructivo: `Eliminar producto`, `Eliminar gasto` o `Quitar persona`.

Titulos:

- `Editar persona`
- `Editar producto`
- `Editar quien comio esto`
- `Editar gasto para todos`
- `Editar gasto de una persona`
- `Editar quien pago`

### Tarjetas de resultado

Usar frases completas:

- `Ana aporta $120`
- `Luis le paga $80 a Sofia`
- `Maria recibe $150`

Estados:

- Verde: recibe o queda cubierto.
- Naranja: debe o falta aportar.
- Neutro: sin saldo relevante.

## 4. Flujo de pantallas

## Pantalla 0: Inicio

Pregunta principal:

Ninguna. Es una pantalla de entrada.

Titulo:

`Vamos a dividir la cuenta`

Texto:

`No necesitas registrarte. Todo queda en este celular.`

Accion principal:

`Empezar`

Accion secundaria:

`Abrir cuenta guardada`

Reglas:

- No mostrar herramientas tecnicas.
- No mostrar tabs.
- No explicar privacidad con mucho texto.

## Pantalla 1: Personas

Pregunta principal:

`Quienes estan en la mesa?`

Controles:

- Campo: `Nombre`
- Boton: `Agregar`
- Lista de tarjetas de persona.
- Boton principal: `Ya estan todos`

Comportamiento:

- Al agregar una persona, limpiar el campo y mantener foco en `Nombre`.
- No hay atajo de pegar varios nombres.
- No hay nombres de ejemplo.

Criterio para avanzar:

- Minimo 2 personas.

Error:

`Agrega al menos a dos personas para dividir`

Editable:

- Nombre de persona.
- Quitar persona.

## Pantalla 2: Tipo de cuenta

Pregunta principal:

`Que van a dividir?`

Opciones grandes:

### Productos de la cuenta

Texto de apoyo:

`Tacos, pizza, refrescos`

Uso:

Camino principal para comidas.

### Gasto para todos

Texto de apoyo:

`Propina, taxi, botella`

Uso:

Algo que se reparte parejo.

### Gasto de una persona

Texto de apoyo:

`Un cafe, un extra, estacionamiento`

Uso:

Algo que pertenece a una sola persona, aunque alguien mas lo haya pagado.

Atajos:

Ninguno.

Reglas:

- Los ejemplos deben ser visibles, no texto minusculo escondido.
- Si la persona elige un flujo alternativo, debe poder volver a esta pantalla.

## Pantalla 3: Productos de la cuenta

Pregunta principal:

`Que producto aparece en la cuenta?`

Controles principales:

- Campo: `Producto`
- Campo numerico: `Precio`
- Boton: `Agregar producto`
- Boton secundario: `Ya termine la cuenta`

Comportamiento de captura continua:

1. La persona escribe producto y precio.
2. Toca `Agregar producto`.
3. Aparece una tarjeta del producto.
4. Dentro de la tarjeta se elige `Quien comio esto`.
5. El formulario queda limpio y listo para capturar el siguiente producto.

Asignacion:

- Mostrar botones grandes con los nombres.
- Boton secundario dentro de la tarjeta: `Todos comieron esto`.
- El producto queda incompleto hasta tener al menos una persona.

Lista:

- Mostrar productos agregados debajo del formulario.
- Cada tarjeta muestra nombre, precio, quienes lo comieron y acciones.

Acciones por tarjeta:

- `Editar`
- `Duplicar`
- `Quitar`

Reglas:

- No regresar a un menu despues de cada producto.
- No usar tabla como interfaz principal en celular.
- `Duplicar` vive en la tarjeta, no como accion global.
- `Ya termine la cuenta` solo se activa si todos los productos tienen personas asignadas.

Errores:

- Producto vacio: `Falta el producto`
- Precio vacio o cero: `Ponle un precio`
- Producto sin personas: `Elige quien comio esto`

## Pantalla 3B: Gasto para todos

Pregunta principal:

`Que gasto se reparte entre todos?`

Ejemplos visibles:

- `Propina`
- `Taxi`
- `Botella`
- `Servicio`

Controles:

- Campo: `Nombre del gasto`
- Campo numerico: `Monto`
- Boton: `Agregar gasto para todos`

Texto de ayuda:

`Clara divide este monto en partes iguales.`

Comportamiento:

- Se asigna a todas las personas en automatico.
- Despues de agregar, mostrar tarjeta de gasto para todos.
- Permitir `Editar` para cambiar nombre, monto o personas incluidas.

Errores:

- `Falta el nombre del gasto`
- `Ponle un monto`

## Pantalla 3C: Gasto de una persona

Pregunta principal:

`Este gasto es solo de alguien?`

Controles:

- Campo: `Nombre del gasto`
- Campo numerico: `Monto`
- Selector: `De quien es`
- Selector: `Quien pago`
- Boton: `Agregar gasto`

Texto de ayuda:

`Si Ana pidio un cafe pero Luis pago la cuenta, el cafe es de Ana y lo pago Luis.`

Comportamiento:

- Despues de agregar, mostrar tarjeta de gasto de una persona.
- Permitir editar nombre, monto, de quien es y quien pago.

Errores:

- `Falta el nombre del gasto`
- `Ponle un monto`
- `Elige de quien es`
- `Elige quien pago`

## Pantalla 4: Quien pago

Pregunta principal:

`Alguien ya pago la cuenta?`

Opciones principales:

### Todavia nadie pago

Texto:

`Clara dira cuanto aporta cada persona.`

### Una persona pago

Texto:

`Elige quien pago para calcular quien le devuelve.`

Al elegir:

- Mostrar tarjetas de personas.
- La persona seleccionada queda marcada como quien pago.

Accion secundaria visible:

`Pagaron varias personas`

Comportamiento de accion secundaria:

- Abrir una pantalla o panel avanzado: `Quien pago cada cosa?`
- Mostrar productos y gastos con selector de pagador por tarjeta.
- No mezclar este flujo con el camino principal.

Criterio para avanzar:

- Elegir `Todavia nadie pago`, o elegir una persona que pago, o completar pagadores por producto/gasto.

Errores:

- `Elige una opcion para calcular`
- `Elige quien pago`

Editable:

- `Editar quien pago` desde resultado.

## Pantalla 5: Resultado

Titulo:

`Listo, asi queda la cuenta`

Escenario A: todavia nadie pago

Seccion:

`Cada quien aporta`

Ejemplos:

- `Ana aporta $120`
- `Luis aporta $80`

Escenario B: una persona pago

Seccion:

`Quien le paga a quien`

Ejemplos:

- `Luis le paga $80 a Ana`
- `Sofia le paga $120 a Ana`

Escenario C: varias personas pagaron

Seccion:

`Pagos entre personas`

Ejemplos:

- `Luis le paga $60 a Ana`
- `Carlos le paga $40 a Sofia`

Accion principal:

`Enviar por WhatsApp`

Accion secundaria:

`Copiar resumen`

Acciones de correccion:

- `Editar personas`
- `Editar productos`
- `Editar gastos`
- `Editar quien pago`

Reglas:

- No mostrar saldos en cero.
- No mostrar formulas.
- No mostrar detalles tecnicos.
- Usar frases completas.

## 5. Estados vacios

### Sin personas

`Agrega a quienes estan en la mesa.`

### Una sola persona

`Agrega al menos a otra persona para dividir.`

### Sin productos

`Agrega el primer producto de la cuenta.`

### Producto sin personas

`Elige quien comio esto para seguir.`

### Sin resultado

`Agrega productos o gastos para calcular.`

## 6. Criterios de aceptacion del wireflow

- Una persona puede completar el flujo principal sin tocar opciones secundarias.
- Una persona puede capturar muchos productos sin volver al menu principal.
- Todo dato importante tiene una forma visible de edicion.
- La diferencia entre producto, gasto para todos y gasto de una persona esta explicada con ejemplos.
- Varias personas pagaron existe como secundario visible, no como camino principal.
- No aparecen conceptos tecnicos.
- No aparece funcionalidad fuera de esta version.
