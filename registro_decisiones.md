# Registro de Decisiones de Arquitectura (ADR) - Clara

> [!IMPORTANT]
> **INSTRUCCIÓN PARA CODEX (PLANIFICADOR / ARQUITECTO):**
> 1. **Lectura Obligatoria**: Antes de iniciar la planificación de cualquier fase de desarrollo en `implementation_plan.md` o crear una nueva aplicación/módulo web, debes leer este archivo en su totalidad.
> 2. **Anexión de Conocimientos**: Debes incorporar la *Jerarquía de Reglas de Arquitectura* y las *Directrices Anti-Vibecoding* en la sección de restricciones de tus planes.
> 3. **Validación de Gates**: Al definir criterios de aceptación ("Gates") para el ejecutor (Antigravity), incluye explícitamente pruebas de sanitización de datos, límites de payload y hardening de redes/costos descritos en las Directrices.

Este documento es el registro histórico de decisiones de diseño, arquitectura y reglas del proyecto Clara. Su propósito es actuar como memoria viva del proyecto, evitando que los agentes de IA o desarrolladores tomen decisiones de diseño contradictorias o repitan errores del pasado.

---

## Jerarquía de Reglas de Arquitectura

### Prioridad 1: Reglas Críticas (Inquebrantables)
1. **Infraestructura Costo $0**: La aplicación debe ser 100% estática (PWA). No se permite la introducción de backends propios, bases de datos centralizadas, ni servicios de autenticación en la nube.
2. **Privacidad Local Absoluta**: Los datos del grupo de gastos nunca deben enviarse a un servidor. Toda la persistencia compartida viaja en el cliente mediante el hash de la URL (`window.location.hash`).
3. **Cifrado de Cliente Seguro**: El transporte de datos en la URL debe emplear la `Web Crypto API` nativa con `AES-GCM` y vectores de inicialización (IV) aleatorios por cada guardado.
4. **Sin Dependencias Externas Innecesarias**: Para garantizar la privacidad y la ejecución offline, no se deben usar librerías externas o CDNs (ej. fuentes de Google, frameworks CSS, scripts de rastreo) que comprometan la autonomía de la app.

### Prioridad 2: Reglas de Implementación y UX
1. **Mobile First y Responsive**: La interfaz debe diseñarse pensando en el uso en restaurante/móvil, asegurando elementos táctiles adecuados (>48px) y sin desbordamientos de pantalla en anchos mínimos de 360px.
2. **Cierre de Mesa Proporcional**: Los balances y el modo cumpleañero deben redistribuir los costos equitativamente entre los participantes restantes activos.
3. **Compatibilidad Hacia Atrás**: Cualquier cambio en el esquema del estado local o en la compresión/cifrado de la URL debe conservar la capacidad de leer versiones de links anteriores.

---

## Historial de Decisiones de Arquitectura (ADRs)

### ADR-001: Arquitectura Serverless y PWA Estática
* **Fecha**: 2026-06-04
* **Estado**: Aceptado
* **Contexto**: El proyecto requiere un costo de mantenimiento de $0 y alta privacidad para evitar el rechazo de los usuarios a muros de pago.
* **Decisión**: La aplicación se construye usando HTML5, CSS vanilla y Vanilla JS. El deploy se realiza en plataformas gratuitas (GitHub Pages / Cloudflare Pages) como archivos estáticos.
* **Consecuencias**: Toda lógica de negocio, cifrado, compresión y cálculo matemático se ejecuta en el navegador del cliente.

### ADR-002: Sincronización Serverless por URL Hash
* **Fecha**: 2026-06-04
* **Estado**: Aceptado
* **Contexto**: Compartir cuentas requiere que múltiples personas vean la información sin base de datos centralizada.
* **Decisión**: Serializar el estado JSON, comprimirlo usando `CompressionStream` (algoritmo Deflate con fallback sin compresión) y cifrarlo con `AES-GCM`. El resultado cifrado y codificado en Base64 URL-safe se almacena en el hash del navegador (`window.location.hash`).
* **Consecuencias**: Los enlaces se vuelven largos al agregar muchos gastos, por lo que se debe monitorizar el tamaño del payload y notificar al usuario si excede los 2048 caracteres.

### ADR-003: Simplificación de Compartir y Modos de Privacidad
* **Fecha**: 2026-06-05
* **Estado**: Aceptado (Ajuste del MVP)
* **Contexto**: Inicialmente se plantearon dos modos en la UI: "Link Fácil" (clave en la URL) y "Modo Privado" (clave manual). El feedback de los usuarios sugirió que causaba fricción cognitiva innecesaria en la interfaz principal.
* **Decisión**: 
  1. Ocultar el selector de modos del flujo principal de compartir.
  2. Por defecto se comparte mediante "Link Fácil" (cifrado con clave autocontenida en la URL) optimizado para enviar por WhatsApp.
  3. Mantener el soporte técnico interno para descifrar enlaces del "Modo Privado" si un usuario abre un link viejo generado previamente.
* **Consecuencias**: UI más limpia enfocada en "Copiar enlace" y "Copiar resumen de WhatsApp".

### ADR-004: Cierre de Mesa con Pagador "Nadie (pago al momento)"
* **Fecha**: 2026-06-05
* **Estado**: Aceptado
* **Contexto**: Al dividir una cuenta en un restaurante, comúnmente nadie ha pagado la cuenta completa al mesero al momento de dividirla. Las apps tradicionales fuerzan a seleccionar un "pagador único", lo cual entorpece el cierre real de la mesa.
* **Decisión**:
  1. Introducir el concepto de "Nadie (pago al momento)" como el pagador predeterminado.
  2. Si se selecciona, la aplicación asume que todos deben aportar su parte directamente a la cuenta total.
  3. En la sección "Pagos" (antes Liquidación), se calcula el total que falta recaudar y se consolidan las deudas de cada persona por igual para simular el dinero entregado por cada uno y el cambio correspondiente.
* **Consecuencias**: Flujo más natural de cobro de mesa. El total faltante inicial coincide con el costo total de la cuenta.

### ADR-005: Eliminación de Recordatorios y OCR Visibles en MVP
* **Fecha**: 2026-06-05
* **Estado**: Aceptado
* **Contexto**: Para lanzar el MVP rápidamente y asegurar una experiencia sin fricciones, se deben quitar funciones no pulidas.
* **Decisión**:
  1. Remover los botones visibles de "Recordatorio de cobro" (PayPal/Venmo/Bizum) al lado de los nombres en la sección de grupo.
  2. Conservar el campo general de recordatorio en la configuración de la cuenta y mantener la compatibilidad para normalizar estados antiguos.
  3. Quitar el escáner de tickets (OCR) visible. La captura de platillos será 100% manual en esta fase.
* **Consecuencias**: Reducción del ruido en la interfaz de usuario móvil.

---

## Registro de Errores Comunes y Regresiones a Evitar

*Cualquier bug resuelto debe registrarse aquí para evitar que futuras iteraciones del agente reintroduzcan el error.*

1. **Bug de Nombres Duplicados en Pagos**:
   * *Problema*: Al calcular deudas consolidadas con "Nadie" o con un pagador que tenía múltiples gastos, la UI renderizaba filas repetidas para la misma persona en la tabla de cierre de mesa.
   * *Solución*: Implementar una consolidación estricta por `personId` al generar las filas en `buildTableCloseRows()`.
2. **Error de Bloqueo por Modo Cumpleañero Excesivo**:
   * *Problema*: Si el usuario marca a todas las personas del grupo como "cumpleañeros/invitados" (quienes no pagan), la app entraba en división por cero o estado inconsistente.
   * *Solución*: Validar que al menos un participante no esté marcado como invitado antes de aplicar el recálculo proporcional. Si todos están marcados, mostrar un banner de bloqueo informativo.
3. **Decaimiento de Easing en Notificaciones (Toasts)**:
   * *Problema*: Las microanimaciones de los mensajes flotantes (toasts) causaban saltos visuales incómodos en navegadores móviles de gama baja debido a transiciones físicas complejas.
   * *Solución*: Usar una curva de atenuación estándar lineal/cubic-bezier limpia y respetar la media query `prefers-reduced-motion`.

---

## Directrices Anti-Vibecoding y Failsafes de Seguridad (Para Todos los Proyectos)

Estas directrices deben aplicarse de forma predeterminada por el agente de IA antes de entregar cualquier desarrollo web o de aplicación, previniendo fallos de diseño estructurales y de seguridad (no actuar como "Vibecoder"):

### 1. Sanitización de Datos (Anti-Texto-Plano)
* **Regla**: Prohibido exponer claves, contraseñas, hashes, tokens de API o datos sensibles en las respuestas de endpoints (GET/POST) o en el cliente de forma legible.
* **Acción del Agente**: Implementar serializadores, DTOs o capas de mapeo de base de datos que excluyan explícitamente las columnas confidenciales por defecto. Las contraseñas deben estar hasheadas con algoritmos fuertes (bcrypt, argon2) antes de tocar la persistencia.

### 2. Paginación y Límites Obligatorios (Anti-Payload Masivo)
* **Regla**: Ningún endpoint de lectura ("Find All") puede carecer de límites. Devolver conjuntos de datos masivos satura la RAM del servidor y destruye el rendimiento del cliente.
* **Acción del Agente**: Incluir de forma obligatoria parámetros de control de flujo (`limit`, `offset`, `page` o paginación por cursor) en todas las consultas y establecer un límite máximo de filas por página por defecto (ej. máximo 50 o 100 registros).

### 3. Hardening de Infraestructura y Redes
* **Regla**: Las configuraciones de servidores, Dockerfiles, Terraform, scripts Bash y Ansible no deben comprometer la seguridad por comodidad.
* **Acción del Agente**:
  * Deshabilitar el acceso del usuario `root` por contraseña en SSH (forzar el uso exclusivo de llaves públicas autorizadas).
  * No exponer puertos administrativos por defecto en entornos de producción sin cortafuegos.
  * No quemar (hardcodear) variables de entorno o credenciales en el código fuente; usar gestores de secretos o variables de entorno inyectadas de forma segura.

### 4. Rate Limiting y Control de Costos Serverless
* **Regla**: Las APIs públicas o bases de datos autogestionadas/serverless (Supabase, Firebase, etc.) deben estar protegidas contra abuso y ataques de denegación de servicio (DoS) que inflen la facturación del usuario.
* **Acción del Agente**: Integrar middleware de limitación de tasa (Rate Limiting) por dirección IP o token en todas las rutas públicas del backend desde el paso inicial del diseño de las APIs.

