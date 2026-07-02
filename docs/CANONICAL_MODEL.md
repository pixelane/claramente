# Modelo canonico propuesto

Estado: propuesta de Fase 0. No cambia el formato guardado actual.

## Fuente de verdad

El estado enriquecido de Claramente (`clara.state.v1`) es la base porque ya soporta persistencia, enlaces, backups, pagos de mesa y compatibilidad hacia atras.

```text
ClaramenteState
  version: 1
  groupName: string
  currency: string
  people: Person[]
  expenses: Expense[]
  tableClose: Record<string, TableCloseRecord>
  updatedAt: number
```

## Entidades

### Person

```text
id: string
name: string
reminder: string
isGuest: boolean
```

### Expense

Campos requeridos:

```text
id: string
description: string
amountCents: integer > 0
paidBy: Person.id
splitWith: Person.id[]
createdAt: number
```

Metadatos de restaurante opcionales:

```text
source: "restaurant"
restaurantId: string
restaurantPaidBy: Person.id | "__self__"
payerShareCents: integer >= 0
restaurantName: string
```

`restaurantPaidBy: "__self__"` representa la cuenta que todavia nadie pago. Cada aportacion queda como un gasto informativo pagado y consumido por la misma persona.

### TableCloseRecord

```text
paidCents: integer >= 0
```

La clave identifica una liquidacion o aportacion de restaurante. El estado de UI se deriva del monto esperado y `paidCents`.

## Invariantes

- Todos los montos se guardan como enteros en centavos.
- Cada `id` es unico dentro de su entidad.
- `paidBy` y cada miembro de `splitWith` deben existir en `people`.
- `splitWith` no contiene duplicados.
- Un gasto valido tiene al menos una persona en `splitWith`.
- Una persona invitada puede consumir, pero no absorbe una parte mientras exista al menos una persona que paga.
- La suma de partes distribuidas debe ser exactamente `amountCents`.
- Los residuos de redondeo se asignan de forma determinista en el orden de `splitWith`.
- El mismo estado produce los mismos balances en cualquier breakpoint.
- Cambiar de shell no modifica datos, IDs ni resultados.
- Importaciones y links se normalizan antes de entrar al store.

## Estado exclusivo de UI

Estos valores no pertenecen al modelo persistido:

- Pantalla o tab activa.
- Sheet, dialogo o menu abierto.
- Persona o gasto en edicion.
- Densidad y breakpoint.
- Mensajes toast o snackbar.
- Valores temporales de formularios sin guardar.

## Mapeo desde Claramente

| Claramente | Canonico | Regla |
|---|---|---|
| `people` | `people` | Agregar `reminder: ""`; conservar `isGuest` |
| `items[].name` | `expenses[].description` | Sanitizar y limitar longitud |
| `items[].amountCents` | `expenses[].amountCents` | Conservar entero |
| `product.eatenBy` | `expense.splitWith` | Excluir invitados solo al calcular, no al guardar consumo |
| `shared.splitWith` | `expense.splitWith` | Conservar participantes seleccionados |
| `single.ownerId` | `expense.splitWith` | Una sola persona |
| `paidMode: single` | `expense.paidBy` | Aplicar el pagador elegido a cada gasto |
| `paidMode: multiple` | `item.paidById` | Mapear pagador por gasto |
| `paidMode: none` | restaurante `__self__` | Generar aportaciones por persona de forma determinista |
| `screen`, `itemMode`, `editing` | No se persiste | Estado exclusivo del shell movil |

## Diferencias que deben resolverse antes de migrar

1. Claramente conserva productos y consumidores individuales; la shell completa puede consolidarlos en descripciones por persona.
2. El modo `none` esta ligado a metadatos de restaurante y no representa todavia cualquier gasto generico sin pagar.
3. Claramente permite un pagador por item en `multiple`; la shell completa expresa el pagador por `Expense`.
4. `tableClose` existe solo en la shell completa de Claramente.
5. La shell completa soporta links, backups, recordatorios y normalizacion legacy; la shell guiada movil todavia no.

Decision propuesta:

- Mantener `Expense` como unidad contable.
- Introducir despues un `expenseGroup` o detalle de items solamente si es necesario conservar edicion por producto sin perdida.
- No agregar `items` como segunda coleccion persistida hasta definir sincronizacion e invariantes.

## Fixtures de contrato

`tests/fixtures/accounts.json` define los primeros casos ejecutables:

- `nobodyPaid`: aportaciones antes de pagar.
- `guestConsumes`: invitado que consume y no paga.
- `cardPayerPending`: alguien pone tarjeta aunque la mesa todavia no se haya pagado.
- `crossViewport`: mismo resultado en movil, tableta y PC.
- `tipAndTaxRounding`: propina y cargos con redondeo deterministico.
- `multiPayer`: varias personas pagaron gastos distintos.

Cada cambio al modelo debe mantener estos fixtures o incluir una migracion versionada y nuevos resultados esperados.

## Compatibilidad

- Leer primero el esquema canonico mas reciente.
- Mantener lectura de `clara.state.v1` y `linksplit.state.v1` durante la migracion.
- No borrar datos anteriores hasta completar al menos una version estable.
- Crear una copia antes de reescribir estado local.
- Conservar decodificacion de links y backups existentes.
