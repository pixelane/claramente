# Product

## Register

product

## Users
People splitting a shared meal, table, trip, or small group expense from a phone. They are usually in a noisy, social context and need quick answers without creating an account or learning finance terms.

## Product Purpose
Claramente helps a group enter people, platillos, shared expenses, who paid, who consumed each item, and the final payments. Success means a non-technical person can understand what they owe or receive in seconds, then share the result by WhatsApp or link.

## Brand Personality
Clear, warm, practical. Claramente should feel human and calm around money, with enough confidence that users trust the totals.

## Anti-references
Do not make it feel like an enterprise dashboard, a bank app, a crypto wallet, a generic SaaS landing page, or a childish bill-splitting toy. Avoid decorative UI that gets in the way of entering people, expenses, and payments.

## Design Principles

## Anti-references
Do not make it feel like an enterprise dashboard, a bank app, a crypto wallet, a generic SaaS landing page, or a childish bill-splitting toy. Avoid decorative UI that gets in the way of entering people, expenses, and payments.

## Design Principles
Start at the task, not a welcome page.
Make money states obvious: receives, owes, paid, pending.
Keep the app local-first and explain privacy only where it affects sharing.
Use familiar mobile patterns that still work well on desktop.
Reduce noise at the end: hide zero-balance clutter and surface the next payment action.

## Accessibility & Inclusion
Use clear contrast, large touch targets, visible focus states, reduced-motion support, and text labels that make sense without color alone.

## Definición Oficial de Interfaces (Shells)

Con el fin de garantizar consistencia y simplicidad, las interfaces se definen de la siguiente manera:
1.  **Versión Oficial Móvil (Flujo Guiado)**: [claramente.html](file:///e:/Work/CODEX/App%20gastos%20divididos/claramente.html) / [claramente.js](file:///e:/Work/CODEX/App%20gastos%20divididos/claramente.js). Está optimizada para celulares en pantallas pequeñas (menos de 720px), guiando al usuario paso a paso.
2.  **Versión Oficial Tablet y PC (Shell Completa)**: [index.html](file:///e:/Work/CODEX/App%20gastos%20divididos/index.html) / [app.js](file:///e:/Work/CODEX/App%20gastos%20divididos/app.js). Ofrece la vista completa de captura y liquidación en una sola pantalla para pantallas más grandes.
3.  **Herramienta Local de QA**: [claramente-local-test.html](file:///e:/Work/CODEX/App%20gastos%20divididos/claramente-local-test.html). Es puramente un visor de pruebas de integración local para cargar fixtures y no debe considerarse fuente de reglas del producto.
4.  **Fixtures oficiales**: Todos los fixtures de pruebas vienen de [accounts.json](file:///e:/Work/CODEX/App%20gastos%20divididos/tests/fixtures/accounts.json).
