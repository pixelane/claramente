# Decision UI/UX: claramente

## Decision

`claramente` sera una experiencia guiada mobile-first para dividir cuentas de mesa. La interfaz debe sentirse actual, tactil y amable, pero no generica de IA ni vieja. El foco principal es que una persona no tecnica pueda entender que hacer, corregir errores y llegar al resultado sin pedir ayuda.

## Direccion visual

Nombre de direccion:

`Mesa clara`

Descripcion:

Una app ligera de mesa, con tarjetas grandes, controles tactiles, lenguaje humano y resultado muy legible. Debe sentirse como una herramienta que alguien puede usar en una comida, no como un banco, una calculadora avanzada o un dashboard.

## Lo que se evita

- Estilo viejo de formulario web.
- Tablas densas en celular.
- Inputs pequenos dentro de listas.
- Muchas opciones al mismo nivel.
- Dashboard con metricas.
- Estilo fintech oscuro.
- Gradientes decorativos de IA.
- Cards repetidas sin jerarquia.
- Textos largos de ayuda.
- Iconos sin etiqueta cuando la accion no es obvia.

## Lo que si se usa

- Una pregunta dominante por pantalla.
- Captura continua donde hay repeticion, especialmente productos.
- Tarjetas grandes y editables.
- Botones principales claros al fondo.
- Paneles inferiores para editar.
- Estados visuales de dinero:
  - verde: recibe o queda cubierto
  - naranja: debe o falta aportar
  - neutro: informacion sin accion urgente
- Ejemplos concretos en opciones dificiles.
- Texto grande y contraste alto.

## Paleta

Mantener la identidad calida de Clara, pero con mas limpieza visual.

Tokens sugeridos:

```css
--bg: #f7f4ee;
--surface: #ffffff;
--surface-soft: #fff8ed;
--ink: #241f1a;
--muted: #675f55;
--line: #e5ddd1;
--primary: #f2a93b;
--primary-strong: #d98219;
--action: #2f7fd3;
--receive: #35b861;
--receive-soft: #dff6e6;
--owe: #e7a24a;
--owe-soft: #ffe3b6;
--danger: #b45309;
```

Uso:

- `primary`: avanzar, agregar, confirmar.
- `action`: editar, seleccionar, acciones secundarias importantes.
- `receive`: resultado positivo.
- `owe`: deuda o aporte pendiente.
- `danger`: eliminar o advertir.

No usar azul como marca principal. Azul solo ayuda a indicar interaccion o seleccion.

## Tipografia y escala

Usar una sola familia del sistema para mantener rendimiento y familiaridad:

```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Reglas:

- Texto base minimo: 16px.
- Pregunta principal: 28px a 34px en celular.
- Botones: 16px a 18px, peso alto.
- Montos importantes: 28px a 40px.
- Nada de texto apretado o con tracking negativo.

## Layout mobile

Estructura por pantalla:

1. Barra superior con `Atras` y progreso corto.
2. Pregunta dominante.
3. Ayuda corta si hace falta.
4. Zona de accion.
5. Lista/tarjetas existentes.
6. Boton principal fijo o casi fijo al fondo.

Ejemplo:

```text
Atras                         2 de 5

Que producto aparece en la cuenta?
Agrega lo que venga en la cuenta o recibo.

[Producto]
[Precio]
[Agregar producto]

Productos agregados
[Pizza $240 | Lo comieron Ana, Luis | Editar | Duplicar]

[Ya termine la cuenta]
```

## Navegacion

No usar tabs como navegacion principal en `claramente`.

Usar:

- `Atras`
- indicador `2 de 5`
- boton principal
- acciones secundarias debajo o dentro de tarjetas

Las tabs pueden quedar solo para version estable o modo avanzado.

## Componentes clave

### Persona

Tarjeta simple:

```text
Ana
Editar    Quitar
```

Regla:

- No avatar obligatorio.
- Se puede usar circulo con inicial para mejorar reconocimiento.
- La inicial no debe competir con el nombre.

### Producto

Tarjeta:

```text
Pizza
$240
Lo comieron: Ana, Luis
Editar    Duplicar    Quitar
```

Regla:

- `Duplicar` existe solo dentro de una tarjeta ya creada.
- Si falta elegir personas, la tarjeta muestra `Elige quien comio esto`.

### Selector de personas

Usar botones grandes tipo chips/tarjetas:

```text
[Ana] [Luis]
[Sofia] [Carlos]
[Todos comieron esto]
```

Regla:

- Cada seleccion debe verse claramente activa/inactiva.
- No depender solo del color; usar check o borde fuerte.

### Gasto para todos

Tarjeta:

```text
Propina
$120
Se divide entre todos
Editar
```

### Gasto de una persona

Tarjeta:

```text
Cafe
$45
De: Ana
Pago: Luis
Editar
```

### Panel inferior

Usar bottom sheet para editar:

```text
Editar producto

Producto
[Pizza]

Precio
[$240]

Quien comio esto
[Ana] [Luis] [Sofia]

[Guardar cambios]
[Eliminar producto]
```

Regla:

- No editar inline en listas densas.
- No abrir modales pequenos centrados en celular.
- El panel debe ser facil de cerrar y no perder cambios accidentalmente.

## Flujo principal

### Inicio

`Vamos a dividir la cuenta`

Boton:

`Empezar`

Secundario:

`Abrir cuenta guardada`

### Personas

`Quienes estan en la mesa?`

Captura una persona a la vez. Despues de agregar, el campo queda listo para otro nombre.

No hay nombres de ejemplo ni pegar varios nombres.

### Tipo de cuenta

`Que van a dividir?`

Opciones:

- `Productos de la cuenta`
- `Gasto para todos`
- `Gasto de una persona`

Cada opcion muestra ejemplos visibles.

### Productos

Modo de captura continua, no pantalla por producto.

Botones:

- `Agregar producto`
- `Ya termine la cuenta`

### Quien pago

Opciones:

- `Todavia nadie pago`
- `Una persona pago`

Secundario visible:

- `Pagaron varias personas`

Este secundario abre un flujo por producto/gasto, no invade el camino principal.

### Resultado

Mostrar solo lo necesario:

- Si nadie pago: `Cada quien aporta`
- Si una persona pago: `Quien le paga a quien`
- Si varias personas pagaron: `Pagos entre personas`

Boton principal:

`Enviar por WhatsApp`

Secundario:

`Copiar resumen`

Correccion:

- `Editar personas`
- `Editar productos`
- `Editar gastos`
- `Editar quien pago`

## Inspiracion permitida

Usar como referencia conceptual:

- apps de gastos compartidos simples
- bancos digitales solo para seleccion visual y confirmaciones
- sistemas de preguntas por pantalla solo para estructura

No copiar:

- look gubernamental
- look bancario
- interfaces con demasiada jerarquia financiera
- visuales de IA con exceso de sombras, blobs o gradientes

## Criterio de calidad

La UI es buena si:

- una persona sabe donde empezar
- una persona puede agregar 10 productos sin sentir que vuelve al principio
- una persona entiende la diferencia entre quien comio y quien pago
- una persona puede corregir un error sin miedo
- el resultado se entiende sin explicar formulas
- se ve actual, pero no intenta impresionar

## Decision tecnica para prototipo

Primera implementacion recomendada:

- crear `claramente.html`
- crear CSS/JS de prototipo si hace falta
- reutilizar calculos existentes cuando sea seguro
- no reemplazar `index.html` hasta validar

Esto permite probar el flujo nuevo sin romper la version estable.
