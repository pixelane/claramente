# Plan de prototipo: claramente

## Objetivo

Crear una version de prueba de Clara llamada `claramente`, enfocada en personas que quieren dividir una cuenta sin entender terminos tecnicos ni explorar muchas opciones. La meta no es agregar funciones nuevas, sino hacer que el flujo sea guiado, claro y facil de completar desde celular.

La version actual queda estable en `main`. `claramente` debe vivir primero como prototipo en rama separada para validar si el flujo guiado funciona mejor antes de reemplazar la experiencia principal.

## Principios

- Una pregunta dominante por pantalla.
- Permitir atajos secundarios solo cuando aceleren sin competir con el camino principal.
- Botones grandes y texto directo.
- Menos opciones visibles, mas ayuda contextual.
- Mobile-first, usable con una mano.
- Sin backend, login, pagos reales ni dependencias remotas.
- Mantener la logica de calculo existente siempre que sea posible.
- Esconder funciones avanzadas detras de `Mas opciones`.
- Todo dato importante debe poder corregirse: nombres, productos, montos, quien comio esto y quien pago.

## Regla de interaccion principal

Cada pantalla debe poder completarse ignorando los atajos.

Estructura maxima recomendada por pantalla:

- 1 pregunta dominante.
- 1 accion principal clara.
- 1 accion de regreso.
- 0 a 2 atajos secundarios.
- 1 texto de ayuda corto como maximo.

Los atajos no deben verse con el mismo peso que la accion principal. Deben agruparse bajo una etiqueta como `Mas rapido` o `Mas opciones`.

Ejemplos de atajos validos:

- `Todos comieron esto`.
- `Repetir ultimo producto`.
- `Agregar otro igual`.

Ejemplos de atajos que se evitan en el flujo principal:

- Configuracion avanzada.
- Diagnostico tecnico.
- Links privados.
- Propina y cargos desde el primer momento.

## Regla de correccion

La persona debe poder corregir sin borrar todo ni volver a empezar.

Campos editables obligatorios:

- Nombre de persona.
- Nombre de producto o gasto.
- Monto.
- Quien consumio un producto.
- Quien pago.
- Tipo de gasto: producto individual, producto compartido o gasto general.

Patron recomendado:

- Cada tarjeta muestra un boton `Editar`.
- La edicion ocurre en una hoja/panel simple, no en inputs pequenos dentro de listas densas.
- Despues de editar, mostrar confirmacion breve: `Listo, se actualizo`.
- Si se elimina algo, pedir confirmacion con lenguaje simple: `Quitar este producto?`
- No usar terminos tecnicos en la interfaz.

## Usuario objetivo

Persona no tecnica, posiblemente mayor, usando el celular en una comida o reunion. Quiere saber rapido cuanto paga cada quien. Puede sentirse confundida si ve muchas opciones, palabras tecnicas o pantallas con varios formularios a la vez.

## Flujo guiado propuesto

### Paso 0: Inicio rapido

Pantalla inicial:

- Titulo: `Vamos a dividir la cuenta`
- Boton principal: `Empezar`
- Boton secundario: `Abrir cuenta guardada`
- Texto corto: `No necesitas registrarte. Todo queda en este celular.`

No mostrar tabs ni herramientas tecnicas en esta pantalla.

### Paso 1: Personas

Pregunta principal:

`Quienes estan en la mesa?`

Acciones:

- Campo grande: `Nombre`
- Boton: `Agregar persona`
- Lista de personas en tarjetas simples.
- Boton: `Ya estan todos`

Atajos secundarios:

- Marcar `No paga` para invitado o cumpleanero cuando ya hay personas en la mesa.

Reglas:

- Usar `Personas` como nombre principal de la seccion.
- No mostrar configuracion de grupo al inicio.
- No mostrar moneda salvo en `Mas opciones`.
- Cumpleanero/invitado se marca como `No paga`: puede consumir, pero su parte se reparte entre quienes si pagan.

### Paso 2: Cuenta

Pregunta principal:

`Que van a dividir?`

Opciones grandes:

- `Productos de la cuenta`
- `Gasto para todos`
- `Gasto de una persona`

Para el primer prototipo, el camino principal debe ser `Productos de la cuenta`, porque es el caso mas comun en comidas.

Regla:

- `Productos de la cuenta` debe ser la opcion principal.
- `Gasto para todos` debe quedar como alternativa clara.
- `Gasto de una persona` debe existir para casos como estacionamiento, taxi o algo que solo uso alguien.

Explicacion visible:

- `Productos de la cuenta`: cosas que aparecen en la cuenta o recibo, como tacos, pizza, refrescos.
- `Gasto para todos`: algo que se reparte parejo, como propina, taxi o botellas.
- `Gasto de una persona`: algo que solo paga una persona, como su bebida o un extra.

### Paso 3: Agregar productos

Pregunta principal:

`Que producto aparece en la cuenta?`

Formulario:

- `Producto`
- `Precio`
- Boton: `Agregar producto`

Despues de agregar cada producto:

- Mostrar tarjeta del producto.
- Preguntar: `Quien lo consumio?`
- Mostrar botones grandes con nombres.
- Accion rapida: `Todos`

Atajos secundarios:

- `Todos comieron esto`
- `Agregar otro igual`
- `Repetir ultimo consumo`

Reglas:

- No usar tabla como interfaz principal en movil.
- No pedir propina ni cargos extra al principio.
- Mover propina/cargos a `Mas opciones`.
- Cada producto agregado debe tener `Editar` y `Quitar`.
- La lista debe mostrar claramente: nombre, monto y quienes lo consumen.
- Si nadie esta seleccionado como consumidor, no dejar avanzar.

### Paso 3B: Agregar gasto para todos

Pregunta principal:

`Que gasto se reparte entre todos?`

Ejemplos visibles:

- `Propina`
- `Taxi`
- `Botella`
- `Servicio`

Formulario:

- `Nombre del gasto`
- `Monto`
- Boton: `Agregar gasto para todos`

Reglas:

- Por defecto se reparte entre todas las personas que pagan.
- Debe permitir editar quienes participan.
- Debe explicar en una linea: `Clara divide este monto en partes iguales.`

### Paso 3C: Agregar gasto de una persona

Pregunta principal:

`Este gasto es solo de alguien?`

Formulario:

- `Nombre del gasto`
- `Monto`
- `De quien es`
- `Quien lo pago`

Reglas:

- Usar este flujo para extras individuales.
- Debe evitar que la persona confunda `de quien es` con `quien pago`.
- Texto de ayuda: `Si Ana pidio un cafe pero Luis pago la cuenta, el cafe es de Ana y lo pago Luis.`

### Paso 4: Pago

Pregunta principal:

`Alguien ya pago la cuenta?`

Opciones:

- `Todavia nadie pago`
- `Si, alguien pago`

Si elige `Si, alguien pago`:

- Mostrar selector de persona con tarjetas.
- Permitir editar el pagador despues desde el resumen.

Reglas:

- Reemplazar `Nadie (pago al momento)` por `Todavia nadie pago`.
- Explicar con una linea: `Si todavia nadie pago, Clara dira cuanto aporta cada persona.`
- No mostrar recordatorios de cobro ni datos de transferencia en el flujo principal.
- Diferenciar visualmente `quien consumio` de `quien pago`.

### Paso 5: Resultado

Titulo:

`Listo, asi queda la cuenta`

Secciones:

- `Cada quien aporta`
- `Quien le paga a quien`
- `Compartir por WhatsApp`

Reglas:

- Ocultar saldos en cero.
- Usar tarjetas grandes verdes/naranjas.
- Usar frases completas:
  - `Ana aporta $120`
  - `Luis le paga $80 a Sofia`
  - `Maria recibe $150`
- Boton principal: `Enviar por WhatsApp`
- Boton secundario: `Copiar resumen`
- Cada seccion importante debe permitir volver a editar:
  - `Editar personas`
  - `Editar productos`
  - `Editar quien pago`

## Navegacion

En el prototipo guiado, evitar tabs como navegacion principal. Usar:

- Barra de progreso: `1 de 5`
- Boton `Atras`
- Boton principal al fondo
- Atajos secundarios agrupados y visualmente menos fuertes

Las tabs `Grupo`, `Gastos`, `Pagos` pueden quedar solo en modo avanzado o en la version estable actual.

## Progressive disclosure

El prototipo debe usar revelacion progresiva: mostrar lo basico primero y revelar opciones solo cuando sean relevantes.

Aplicacion en claramente:

- Propina aparece despues de que ya hay productos.
- Cumpleanero/invitado aparece despues de que ya hay personas.
- Gasto compartido aparece como alternativa, no como formulario abierto.
- Gasto individual aparece solo cuando la persona elige `Gasto de una persona`.
- Compartir link aparece despues del resultado, no antes.
- Diagnostico, backup y consola quedan fuera del flujo normal.

Riesgo a evitar:

- No explicar cada mini-calculo durante el proceso. Eso puede distraer. La app debe guiar la accion y mostrar un resultado claro al final.

## Funciones que se esconden en Mas opciones

- Nombre del grupo.
- Moneda.
- Propina.
- Cargos adicionales.
- Exportar/importar copia.
- Diagnostico y consola de errores.
- Link del grupo.

## Funciones fuera de alcance en esta fase

- Login.
- Sincronizacion.
- Pagos reales.
- Nuevas librerias externas.
- Redisenar calculos internos.

## Arquitectura tecnica sugerida

Crear una rama:

```powershell
git checkout -b codex/claramente-guided-prototype
```

Mantener los archivos actuales, pero agregar una capa de flujo guiado:

- Estado de paso actual.
- Componentes renderizados por paso.
- Reuso de funciones existentes de personas, gastos, calculos y WhatsApp.
- Modo avanzado oculto o accesible desde soporte.

Opciones de implementacion:

1. `index.html`, `style.css`, `app.js` actuales con nuevas secciones guiadas.
2. Un archivo experimental `claramente.html` para probar sin tocar el flujo estable.

Recomendacion: empezar con `claramente.html` si queremos comparar rapido sin arriesgar la app actual. Si funciona mejor, se integra como experiencia principal.

## Skills a usar

- `impeccable`: estructura visual y producto.
- `mobile-design`: mobile-first, tactil, legible.
- `form-cro`: reducir friccion y decisiones.
- `ui-ux-pro-max`: accesibilidad, labels, contraste.
- `frontend-design`: componentes finales.
- `webapp-testing`: pruebas de tareas.
- `lint-and-validate`: validacion despues de cambios.

## Pruebas con personas

Tareas de prueba:

1. Agrega tres personas.
2. Agrega una pizza de $240 que comieron dos personas.
3. Agrega dos refrescos de $30 para una persona cada uno.
4. Marca que todavia nadie pago.
5. Encuentra cuanto aporta cada persona.
6. Comparte el resumen por WhatsApp.
7. Corrige el precio de un producto.
8. Corrige el nombre de una persona.
9. Cambia quien consumio un producto.
10. Agrega un gasto para todos.
11. Agrega un gasto de una persona pagado por alguien mas.

Prueba de atajos:

1. Repetir el mismo producto dos veces.
2. Pegar tres nombres juntos.
3. Marcar que todos comieron un producto.

Senales de exito:

- La persona no pregunta donde empezar.
- La persona entiende que hacer despues de cada paso.
- La persona no necesita leer textos largos.
- La persona identifica el resultado final sin explicacion externa.
- La persona no toca herramientas avanzadas por accidente.
- La persona puede ignorar los atajos y aun asi completar el flujo.
- Una persona con mas practica puede usar atajos sin perder el hilo.
- La persona entiende la diferencia entre producto, gasto para todos y gasto de una persona.
- La persona puede corregir un error sin pedir ayuda.

## Fases

### Fase 1: Wireflow en texto

Definir pantallas, textos exactos, botones y estados vacios.

### Fase 2: Prototipo visual local

Crear `claramente.html` o rama guiada con flujo de 5 pasos usando datos reales.

### Fase 3: Prueba manual

Probar en celular con tareas simples y observar confusion.

### Fase 4: Ajuste

Eliminar pasos confusos, renombrar textos, agrandar controles y esconder mas opciones.

### Fase 5: Decision

Si claramente funciona mejor, migrar el flujo guiado a la app principal. Si no, conservarlo como experimento y rescatar solo aprendizajes.

## Criterio para avanzar

No avanzar a implementacion hasta tener aprobado:

- flujo de 5 pasos,
- textos principales,
- explicacion de productos, gastos para todos y gastos de una persona,
- que funciones van en `Mas opciones`,
- que atajos aparecen en cada pantalla,
- como se edita cada dato,
- si sera `claramente.html` separado o rama con reemplazo visual.
