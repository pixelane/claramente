# Plan de fusion UX/UI: Claramente, Clara tablet y Clara PC

## Decision recomendada

Fusionar las experiencias en una sola aplicacion responsive con:

- Un solo modelo de datos.
- Un solo motor de calculos.
- Una sola capa de persistencia, enlaces, backups y seguridad.
- Tres composiciones de interfaz segun el espacio disponible.

Las tres composiciones conservaran objetivos distintos:

- `Claramente movil`: flujo guiado, una pregunta dominante por pantalla.
- `Clara tableta`: flujo visible por etapas, con contexto y resumen simultaneos.
- `Clara PC`: espacio de trabajo nuevo para captura, revision y cierre de cuentas complejas.

No se recomienda mantener tres aplicaciones independientes. La separacion actual ya duplica estado, calculos, componentes y correcciones.

## Viabilidad

La fusion es viable, pero no debe empezar uniendo HTML o CSS. Primero se debe extraer la logica comun.

Situacion actual:

- `app.js` contiene el producto mas completo: persistencia, normalizacion, enlaces cifrados, backups, gastos de restaurante, pagos de mesa y soporte.
- `claramente.js` contiene un flujo movil mas claro, pero mantiene estado y calculos propios.
- Los modelos de `expenses` e `items` no son equivalentes.
- Ambas interfaces renderizan y calculan resultados por separado.

Riesgo principal:

Si solo se aplican media queries para mezclar ambas interfaces, seguiran existiendo dos fuentes de verdad. Un mismo grupo podria producir resultados o comportamientos diferentes segun el dispositivo.

## Principios de producto

1. El dispositivo cambia la composicion, no las reglas de la cuenta.
2. La experiencia se decide por espacio disponible, no por deteccion de telefono o tableta.
3. Una cuenta iniciada en movil debe abrirse sin perdida en tableta o PC.
4. Las funciones avanzadas existen en los tres modos, pero su visibilidad cambia.
5. El camino principal sigue siendo `Todavia nadie pago` y el cierre por aportaciones.
6. Los estados monetarios deben entenderse tambien sin depender del color.
7. Se conserva funcionamiento local-first, sin login ni backend.

## Sistema responsive propuesto

Usar el scaffold adaptativo de Material 3 como referencia y tokens propios de Clara.

### Compacto: Claramente movil

Rango inicial de trabajo: menos de 600 px.

- Flujo de cinco etapas.
- Una pregunta y una accion principal por pantalla.
- Barra superior con regreso y progreso.
- Accion principal fija al fondo cuando sea necesaria.
- Edicion mediante bottom sheet.
- Listas de participantes, productos y resultados en una columna.
- Opciones avanzadas bajo revelacion progresiva.

### Medio: Clara tableta

Rango inicial de trabajo: 600 a 839 px.

- Navegacion por etapas visible como rail o tabs laterales.
- Formulario principal y resumen contextual en dos zonas.
- Productos editables sin abandonar el contexto de la cuenta.
- Panel de total y estado de avance persistente.
- Dialogos solamente para tareas que realmente interrumpen el flujo.
- Controles tactiles de al menos 48 px.

### Expandido: Clara tableta horizontal y PC pequeno

Rango de trabajo: 840 a 1199 px.

- Supporting pane de dos zonas.
- Rail colapsado o expandido segun el contenido.
- Captura principal y resumen contextual visibles.
- Sin tercera zona permanente.

### Grande: Clara PC

Rango de trabajo: 1200 a 1599 px.

- Nuevo workspace de tres zonas:
  - Navegacion y estado del grupo.
  - Captura y edicion de participantes/gastos.
  - Resumen, pagos y acciones de compartir.
- Densidad comoda o compacta sin reducir legibilidad.
- Edicion inline donde sea clara y panel lateral para ediciones complejas.
- Atajos de teclado documentados para captura repetitiva.
- Resumen y validaciones visibles durante la captura.
- Sin convertir la aplicacion en un dashboard financiero.

### Extra grande: Clara PC amplia

Rango de trabajo: 1600 px o mas.

- Permitir tres zonas cuando todas tengan contenido util.
- Limitar el ancho de lectura y formularios.
- Evitar estirar listas, campos y texto para ocupar todo el monitor.

Los breakpoints se validaran con contenido real. No se usaran como etiquetas rigidas de dispositivo.

## Directrices Material 3 que se adoptan

### Scaffold adaptativo

- Cambiar la estructura segun ancho y densidad.
- Mantener orden de lectura y acciones equivalentes en los tres modos.
- Permitir que paneles aparezcan lado a lado solo cuando haya espacio util.

### Espaciado basado en 8 px

- Crear tokens de 4, 8, 12, 16, 24, 32 y 48 px.
- Usar los tokens para margenes, padding y gaps.
- Reducir valores aislados y mantener ritmo consistente.
- Ajustar densidad por contexto sin reducir areas tactiles.

### Listas y menus expresivos

- Dar mas jerarquia a nombre, monto, consumo y estado.
- Usar estado seleccionado claro, no solo cambio de color.
- Permitir variantes compacta, comoda y de resultado.
- Reservar color fuerte para seleccion, accion y estados monetarios.

### Movimiento

- Transiciones de 150 a 250 ms para cambio de etapa, seleccion y confirmacion.
- Movimiento para explicar continuidad, no como decoracion.
- Mantener alternativa con `prefers-reduced-motion`.

### Lo que no se adopta

- APIs Compose o componentes exclusivos de Android.
- Color expresivo en todos los elementos.
- Formas exageradas, animaciones decorativas o menus poco familiares.
- Variaciones visuales que cambien el significado entre modos.

## Arquitectura objetivo

### 1. Modelo canonico

Tomar como base el estado enriquecido de Clara:

- `groupName`
- `currency`
- `people`
- `expenses`
- `tableClose`
- `updatedAt`

Extenderlo solo cuando un caso de Claramente no pueda representarse sin perdida. `items` no debe convertirse en una segunda fuente de verdad.

### 2. Nucleo compartido

Extraer modulos sin acceso directo al DOM:

- `core/model.js`: estado vacio, tipos y migraciones.
- `core/validation.js`: sanitizacion y normalizacion.
- `core/calculations.js`: repartos, balances, aportaciones y liquidaciones.
- `core/storage.js`: localStorage, importacion y exportacion.
- `core/share.js`: resumen, enlaces, compresion y cifrado.
- `core/store.js`: acciones y suscripcion a cambios.

### 3. Sistema visual compartido

- `ui/tokens.css`: color, tipografia, espacio, radios, elevacion y movimiento.
- `ui/components.css`: botones, campos, listas, chips, estados, sheets y paneles.
- Variantes mediante atributos como `data-density` y `data-layout`.
- Un solo vocabulario de iconos y estados interactivos.

### 4. Tres shells de presentacion

- `ui/mobile/`: flujo Claramente.
- `ui/tablet/`: Clara tableta.
- `ui/desktop/`: Clara PC.

Los shells consumen el mismo store. No duplican calculos, validacion, persistencia ni comparticion.

### 5. Seleccion de composicion

- CSS container queries y media queries para layout.
- JavaScript solamente cuando la estructura funcional realmente cambie.
- Parametro de prueba `?view=mobile|tablet|desktop` para QA y demos.
- El parametro no crea datos separados ni cambia reglas de negocio.

## Plan por fases

### Fase 0: Contrato y linea base

- Documentar todos los casos que soporta cada version.
- Comparar modelos `items` y `expenses` campo por campo.
- Crear cuentas de prueba con resultados esperados.
- Registrar capturas de los flujos actuales en movil y tableta.
- Acordar textos principales y nombre visible del producto.

Entregable: matriz de capacidades, contrato de estado canonico y fixtures de prueba.

Criterio de salida: cada caso actual tiene representacion en el modelo canonico.

### Fase 1: Motor comun con pruebas

- Extraer calculos puros de Clara.
- Compararlos con los resultados de Claramente.
- Resolver diferencias de redondeo, invitados, gastos individuales y multiples pagadores.
- Crear pruebas unitarias para todos los fixtures.
- Extraer sanitizacion, normalizacion y formato monetario.

Entregable: nucleo compartido sin cambios visibles.

Criterio de salida: ambas interfaces producen exactamente los mismos totales usando el nucleo.

### Fase 2: Estado, persistencia y migracion

- Crear store compartido y acciones de dominio.
- Conectar primero Clara al nuevo store.
- Implementar adaptador temporal de Claramente hacia el modelo canonico.
- Migrar datos locales existentes de forma idempotente.
- Mantener lectura de enlaces y backups anteriores.
- Evitar sobrescribir datos si una migracion falla.

Entregable: una sola fuente de verdad compatible con datos actuales.

Criterio de salida: una cuenta puede abrirse en cualquier composicion sin cambiar resultados.

### Fase 3: Tokens y componentes Material 3 adaptados

- Definir escala de espaciado de 8 px y subpaso de 4 px.
- Normalizar tipografia, colores semanticos, radios, foco y elevacion.
- Construir variantes de listas para personas, gastos, pagadores y resultados.
- Completar estados hover, focus, active, disabled, loading y error.
- Eliminar combinaciones decorativas de borde mas sombra amplia.
- Validar contraste y objetivos tactiles.

Entregable: sistema visual compartido aplicado primero a componentes aislados.

Criterio de salida: los mismos componentes funcionan en las tres densidades.

### Fase 4: Claramente movil sobre el nucleo comun

- Mantener el flujo guiado de cinco pasos.
- Sustituir estado y calculos internos por el store compartido.
- Conectar guardado, apertura, link, backup y WhatsApp reales.
- Conservar bottom sheets para edicion.
- Integrar propina, cargos y funciones avanzadas mediante revelacion progresiva.

Entregable: experiencia movil completa, no prototipo.

Criterio de salida: paridad funcional con Clara sin perder simplicidad.

### Fase 5: Clara tableta

- Crear scaffold medio con navegacion por etapas y dos zonas.
- Mantener controles tactiles y contexto visible.
- Reusar listas y formularios del sistema compartido.
- Validar vertical, horizontal, teclado virtual y rotacion.

Entregable: experiencia tablet dedicada dentro de la misma app.

Criterio de salida: ninguna tarea importante requiere volver al layout movil o PC.

### Fase 6: Nueva Clara PC

- Construir workspace expandido con navegacion, captura y resumen.
- Incorporar panel lateral de edicion y captura repetitiva eficiente.
- Agregar atajos de teclado sin ocultar acciones visibles.
- Optimizar listas largas, foco y recorrido por teclado.
- Mantener lenguaje humano y evitar apariencia de software contable.

Entregable: nueva experiencia PC.

Criterio de salida: captura y correccion mas rapidas que en la Clara actual.

### Fase 7: Consolidacion de entrada y PWA

- Convertir `index.html` en la entrada unica.
- Incluir todos los modulos y assets en el service worker.
- Mantener redireccion temporal desde `claramente.html`.
- Conservar parametros forzados de vista para QA.
- Actualizar cache sin perder estado local.

Entregable: una sola aplicacion instalable y compartible.

Criterio de salida: no existen rutas activas con logica duplicada.

### Fase 8: Pruebas y retiro de codigo anterior

- Ejecutar pruebas unitarias del nucleo.
- Probar flujos completos en los tres rangos.
- Validar enlaces faciles y privados, backups y restauracion.
- Probar teclado, lector de pantalla, zoom 200% y movimiento reducido.
- Comparar resultados con fixtures de regresion.
- Retirar calculos y estado duplicados solo despues de paridad confirmada.

Entregable: matriz de validacion y limpieza final.

## Migracion sin interrupciones

1. Mantener `clara.state.v1` como fuente inicial durante la extraccion.
2. Introducir una version nueva solo si cambia el esquema.
3. Leer primero el esquema nuevo y despues los formatos anteriores.
4. Crear copia local antes de escribir una migracion.
5. Mantener decodificacion de links y backups existentes.
6. No borrar claves antiguas durante al menos una version estable.
7. Probar actualizacion con service worker y cache anterior.

## Pruebas obligatorias

### Negocio

- Dos o mas personas con productos compartidos.
- Invitado que consume y no paga.
- Todavia nadie pago.
- Una persona pago todo.
- Varias personas pagaron.
- Gasto individual pagado por otra persona.
- Propina y cargos con redondeos.
- Pagos parciales y cierre de mesa.

### Persistencia y compartir

- Recarga local.
- Link facil.
- Link privado y clave separada.
- Importar y exportar backup.
- Migrar datos actuales.
- Actualizar PWA sin perder cuenta.

### UX responsive

- 320, 360 y 430 px.
- 600, 768 y 834 px en ambas orientaciones.
- 1024, 1280, 1440 y 1920 px.
- Zoom a 200%.
- Teclado completo y teclado virtual.
- Contenido largo, nombres largos y listas grandes.

## Criterios de exito

- Un solo resultado para la misma cuenta en cualquier vista.
- Cero duplicacion de reglas de calculo y persistencia.
- Cambio de ancho sin perdida de datos ni reinicio del flujo.
- Claramente mantiene una accion dominante por pantalla.
- Clara tableta muestra contexto sin saturar.
- Clara PC reduce pasos y tiempo de captura.
- Todas las funciones actuales siguen accesibles.
- Contraste, foco, objetivos tactiles y movimiento reducido pasan validacion.

## Riesgos y mitigacion

- Riesgo: intentar compartir componentes antes de compartir el modelo.
  Mitigacion: completar fases 1 y 2 antes del rediseño integral.
- Riesgo: hacer que movil sea una version encogida de PC.
  Mitigacion: shells distintos sobre el mismo nucleo.
- Riesgo: perder enlaces o datos existentes.
  Mitigacion: migracion versionada, fixtures y compatibilidad hacia atras.
- Riesgo: exceso de expresividad Material 3.
  Mitigacion: color restringido, movimiento funcional y pruebas con tareas reales.
- Riesgo: mantener indefinidamente adaptadores temporales.
  Mitigacion: fecha y criterio de retiro definidos en fase 8.

## Orden recomendado de ejecucion

1. Fases 0 a 2: reducir riesgo tecnico.
2. Fase 3: crear la base de tokens y componentes compartidos.
3. Fase 4: convertir Claramente en el movil real.
4. Fase 5: tableta.
5. Fase 6: nueva PC.
6. Fases 7 y 8: entrada unica, validacion y retiro de duplicados.

## Punto de aprobacion antes de implementar

No iniciar cambios de producto hasta aprobar:

- El modelo canonico.
- Los limites entre movil, tableta y PC.
- Los breakpoints iniciales.
- La estructura del workspace PC.
- La compatibilidad requerida para links y backups anteriores.
- Los fixtures que definen resultados correctos.

## Anexo: revision completa de Material 3

Este anexo incorpora la revision de `Get started`, `Develop`, `Foundations`, `Styles` y `Components` realizada sobre la documentacion vigente de Material 3.

### Decision de implementacion web

- Material Web Components esta en modo de mantenimiento.
- Material 3 Expressive no esta implementado oficialmente para web.
- Clara no debe adoptar Material Web como dependencia nueva.
- Los principios, tokens y especificaciones se implementaran con HTML, CSS y JavaScript propios.
- Cuando una especificacion Expressive no este disponible en web, se tratara como referencia de diseno, no como promesa de paridad tecnica.

### Breakpoints oficiales

Sustituir los tres rangos simplificados por los cinco breakpoints de Material:

- Compacto: menos de 600 px. Claramente movil, un panel.
- Medio: 600 a 839 px. Clara tableta, uno o dos paneles segun contenido y orientacion.
- Expandido: 840 a 1199 px. Tableta horizontal o PC pequeno, dos paneles.
- Grande: 1200 a 1599 px. Clara PC, dos paneles amplios y una zona auxiliar cuando aporte contexto.
- Extra grande: 1600 px o mas. Clara PC, hasta tres paneles con limites de ancho legibles.

Reglas:

- Disenar por espacio disponible, no por nombre o tipo de dispositivo.
- Al cambiar de breakpoint, decidir explicitamente que se revela, divide, redimensiona, reposiciona o sustituye.
- Considerar altura compacta solamente cuando el teclado virtual o una ventana baja oculten acciones importantes.
- Mantener el mismo estado y la misma tarea al cambiar de orientacion o redimensionar.

### Layout canonico seleccionado

- Compacto: flujo de un panel.
- Medio y expandido: `supporting pane`, con tarea principal y resumen contextual.
- Grande: `supporting pane` ampliado o `list-detail` para editar productos y personas.
- Extra grande: composicion de tres paneles solamente cuando grupo, captura y resumen tengan contenido util simultaneo.

Correccion al concepto PC inicial:

La interfaz de PC no debe imponer tres columnas desde 840 px. Dos paneles son la base; el tercero aparece desde el breakpoint grande cuando no reduzca la claridad de formularios y resultados.

### Accesibilidad como contrato

- Tratar WCAG como punto de partida, no como meta maxima.
- Validar contraste, foco, zoom, lector de pantalla, teclado y orden de lectura en cada shell.
- Mantener al menos dos indicadores en estados importantes, por ejemplo color mas icono o color mas texto.
- Permitir que preferencias como contraste y movimiento reducido cambien tokens sin alterar componentes.
- Probar discapacidades situacionales: una mano ocupada, ruido, poca luz, pantalla reflejante y prisa.
- No bloquear zoom ni orientacion.

### Contenido y lenguaje

- Todo texto de interfaz debe poder entenderse sin conocimiento financiero.
- Usar sentence case y etiquetas breves.
- Botones con verbo y objeto: `Agregar persona`, `Guardar producto`, `Copiar resumen`.
- Errores breves, especificos y accionables.
- Evitar explicaciones permanentes cuando una ayuda contextual o ejemplo corto sea suficiente.
- Mantener consistentes `consume`, `paga`, `aporta`, `debe` y `recibe` en todas las vistas.

### Arquitectura de tokens

Organizar tokens en tres niveles:

- Referencia: valores base de paleta, medidas y tipografia.
- Sistema: roles como superficie, accion, texto, error, debe y recibe.
- Componente: valores concretos de boton, lista, campo, rail, sheet y snackbar.

Reglas:

- No usar hexadecimales, sombras, radios o duraciones aislados dentro de componentes.
- Los nombres describen la funcion, no el valor visual.
- Los modos de contraste y densidad sustituyen valores de sistema sin cambiar el contrato del componente.
- Mantener tokens propios de Clara; no copiar nombres Material cuando no agreguen significado al producto.

### Color

- Mantener una estrategia restringida: neutros tintados y un acento principal.
- Conservar colores semanticos de `debe`, `recibe`, `pendiente`, `error` y `completado` fuera de cualquier personalizacion dinamica.
- Preparar esquemas de contraste estandar, medio y alto, aunque el primero sea el unico entregado inicialmente.
- Incluir tema oscuro solo despues de validar el tema claro y los estados monetarios.
- No activar color dinamico del dispositivo en la primera migracion; podria debilitar la identidad y el significado del dinero.

### Elevacion

- Usar diferencias tonales de superficie antes que sombras.
- Limitar la escala a pocos niveles semanticos.
- Listas, cards y navegacion en reposo no necesitan sombra por defecto.
- Reservar sombra para sheets modales, dialogos y superficies que realmente flotan.
- Eliminar la combinacion repetida de borde mas sombra amplia.

### Tipografia

- Mantener una familia sans del sistema para velocidad, privacidad y consistencia.
- Crear roles `headline`, `title`, `body` y `label` mediante tokens.
- Usar estilos enfatizados solamente en totales, resultado final o una accion decisiva.
- No introducir las 30 variantes de Material si Clara no las necesita.
- Ajustar roles por contexto, sin convertir el tipo responsive en escalas dramaticas.

### Iconografia

- Elegir una sola familia visual: outlined en reposo y filled para seleccion cuando corresponda.
- Todo icon button debe tener nombre accesible.
- En web de escritorio, todo icon button ambiguo debe mostrar tooltip.
- No usar iconos cuando una etiqueta textual corta sea mas clara.
- Evitar una fuente remota de iconos; preferir SVG locales o sprites incluidos en la PWA.

### Movimiento

- Usar el esquema estandar de Material para un producto utilitario.
- Evitar el overshoot y rebote del esquema expresivo.
- Mantener transiciones cortas y predecibles para seleccion, cambio de panel y confirmacion.
- Si se usan springs en web, configurarlos con amortiguacion suficiente para no rebotar.
- `prefers-reduced-motion` reemplaza movimiento espacial por cambios instantaneos o fundidos breves.

### Formas

- Aplicar una escala pequena y consistente de radios.
- Usar forma para comunicar seleccion o agrupacion, no como decoracion.
- No adoptar la biblioteca de formas abstractas de Material para Clara.
- Permitir un cambio leve de forma en controles seleccionables solo si mejora la lectura del estado.

## Matriz de componentes por experiencia

### Navegacion

- Claramente movil: progreso y boton atras. La navigation bar no debe competir con el flujo guiado.
- Clara tableta: rail colapsado cuando existan destinos persistentes; navigation bar flexible solo si hay entre tres y cinco destinos equivalentes.
- Clara PC: rail expandido persistente.
- No introducir navigation drawer nueva; Material Expressive recomienda sustituirla por rail expandido.
- No usar navigation bar para el flujo guiado de una sola tarea de Claramente.
- Mostrar siempre icono y etiqueta en destinos persistentes.
- Usar icono filled, etiqueta con mayor peso e indicador de superficie para el destino activo.
- Mantener una sola navegacion primaria visible a la vez.
- En tableta, centrar verticalmente los destinos del rail cuando mejore el alcance tactil.
- El rail colapsado no debe desaparecer; el rail expandido modal si puede ocultarse.
- Permitir que las etiquetas crezcan hasta 200% sin ocultar su texto completo.

### Acciones y seleccion

- Boton filled para la accion principal de cada contexto.
- Tonal u outlined para acciones secundarias.
- Text button para acciones terciarias.
- Icon buttons solo para acciones reconocibles, con tooltip en PC.
- Sustituir segmented buttons nuevos por connected button groups.
- Usar grupos conectados para elecciones simples de dos a cinco opciones.
- Usar chips cuando haya mas opciones, seleccion multiple o nombres de personas.
- Mantener iguales el tamano, forma y estilo de color dentro de cada grupo conectado.
- No permitir que un button group salte a una segunda linea; apilar grupos completos cuando falte ancho.
- Limitar el ancho maximo del grupo en tableta y PC para evitar botones excesivamente anchos.
- La etiqueta accesible de un boton debe coincidir con su texto visible, agregando contexto solo cuando sea necesario.
- Probar etiquetas de botones con texto al 200% y clics rapidos repetidos.

### Listas

- Adoptar listas expresivas para participantes, productos, pagadores y resultados.
- Preferir estilo estandar para captura densa y segmented para seleccion o grupos claramente separados.
- Mantener alturas consistentes de 56, 72 u 88 px segun contenido.
- Mostrar nombre, detalle y accion siempre en posiciones consistentes.
- Reforzar seleccion con superficie, icono y texto, no solo color.

### Sheets y dialogos

- Bottom sheet en compacto para contenido secundario o edicion breve.
- En medio, usar bottom sheet estandar solo cuando deba coexistir con contenido tactil; preferir side sheet para edicion.
- Side sheet en expandido, grande y extra grande para editar sin perder el contexto principal.
- El contenido principal nunca vive permanentemente dentro de un sheet.
- Dialogo solo para una tarea unica o una confirmacion de alto riesgo, como eliminar progreso.
- Preferir edicion inline o supporting pane cuando no haya interrupcion real.
- Los modal bottom sheets quedan reservados al movil.
- Si un bottom sheet puede arrastrarse, su handle debe funcionar como boton con `Tab`, `Space` y `Enter`.
- Toda accion de arrastre necesita una alternativa de un solo toque o clic.
- Side sheets deben tener ancho acotado, permanecer junto a un borde y ofrecer boton Cerrar visible.
- Un side sheet modal en compacto puede convertirse en standard al entrar en medio o expandido.
- Al abrir un dialogo, mover el foco al primer control; mantenerlo dentro y restaurarlo al control de origen al cerrar.
- Permitir cerrar dialogos descartables con `Escape`.
- Usar dialogos solamente para informacion critica o decisiones obligatorias; usar feedback inline o snackbar para lo demas.

### Cards y superficies

- Usar card solo cuando el contenido represente una unidad independiente.
- Preferir filled u outlined sin sombra para listas y resumentes.
- No envolver cada seccion o control en una card.
- Evitar cards anidadas.

### Menus y toolbars

- Menu para acciones temporales o poco frecuentes.
- Toolbar para acciones que deben permanecer visibles.
- En PC, colocar editar, duplicar y eliminar en toolbar contextual o menu por elemento segun frecuencia.
- No ocultar la accion principal en un menu.
- Mantener visibles pero deshabilitadas las acciones temporalmente no disponibles cuando ayude a entender el menu.
- En web, usar divisores para agrupar menus; los gaps expresivos de Material no estan disponibles.
- No usar menus vibrantes salvo un caso excepcional de seleccion que necesite alto enfasis.

### Campos

- Elegir una sola variante principal, filled u outlined, y aplicarla consistentemente.
- Hacer visibles de inmediato los estados vacio, completado, enfocado, invalido y deshabilitado.
- Etiquetas y errores deben permanecer asociados al campo.
- Los campos monetarios deben incluir moneda y formato sin depender del placeholder.
- La etiqueta debe permanecer visible tambien cuando el campo contiene texto.
- El placeholder nunca sustituye la etiqueta.
- No mezclar filled y outlined dentro del mismo formulario o region.
- Elegir outlined como candidato inicial para formularios densos de Clara, sujeto a prueba de contraste y claridad.

### Feedback

- Snackbar o toast para confirmaciones no interruptivas.
- Mensaje persistente cuando la persona debe actuar o corregir algo.
- No usar snackbar para errores que bloquean continuar.
- Anunciar cambios relevantes mediante regiones `aria-live` sin repetir contenido innecesariamente.
- Mantener errores bloqueantes junto al campo o accion que debe corregirse.
- Un snackbar persistente debe ofrecer una accion o una forma clara de descartarlo.

## Hallazgos de la segunda auditoria automatizada

La pasada adicional con la API Playwright del navegador activo confirmo y agrego estas decisiones:

- Claramente es un flujo de una sola tarea, por lo que progreso y regreso son correctos; una navigation bar seria semanticamente incorrecta.
- La navigation bar queda disponible solamente para tres a cinco destinos superiores equivalentes en una futura superficie no guiada.
- El rail es apropiado desde medio, pero no debe convivir con otra navegacion primaria.
- Los grupos conectados sustituyen controles segmentados, pero deben mantenerse en una sola linea y conservar un estilo uniforme.
- Las listas necesitan alineacion repetible de texto, iconos, importes y acciones para poder escanearse rapidamente.
- Campos con labels permanentes reducen errores frente a placeholders que desaparecen.
- Bottom sheets arrastrables requieren controles equivalentes para teclado y movilidad reducida.
- Side sheets son la progresion natural de la edicion desde tableta hacia PC.
- Dialogos necesitan foco inicial, ciclo de foco, `Escape` y retorno de foco.
- Acciones no disponibles dentro de menus pueden conservarse deshabilitadas en vez de desaparecer, evitando cambios impredecibles en su orden.

Limitacion de herramientas observada:

- La skill comunitaria `playwright-skill` esta registrada, pero su instalacion local no incluye `playwright-core`.
- No instalar dependencias como parte del trabajo de planificacion.
- La validacion se completo con la API Playwright incluida en `browser:control-in-app-browser`.

## Ajustes al orden de ejecucion

Agregar estos entregables a las fases existentes:

- Fase 0: matriz de componentes, glosario de contenido y mapa de estados accesibles.
- Fase 3: tokens de referencia, sistema y componente; contraste estandar, medio y alto.
- Fase 4: bottom sheets solo secundarios y listas expresivas para movil.
- Fase 5: supporting pane y rail colapsado para tableta.
- Fase 6: supporting pane como base, rail expandido y tercer panel solo en grande o extra grande.
- Fase 8: pruebas en los cinco breakpoints oficiales, no solamente movil, tableta y PC genericos.

## Directrices descartadas conscientemente

- Dependencia nueva de Material Web Components.
- Navigation drawer como navegacion principal.
- Segmented buttons para componentes nuevos.
- Esquema de movimiento expresivo con rebote.
- Formas abstractas y morphing decorativo.
- Color dinamico en estados monetarios.
- Sombras como indicador principal de jerarquia.
- FAB como accion principal global, porque el flujo ya tiene acciones contextuales claras.
- Carousels para datos de la cuenta.
- Busqueda global mientras el volumen de participantes y gastos no la justifique.
