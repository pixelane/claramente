# Agent Instructions

## Stack
- Static local-first PWA: HTML, CSS, and plain JavaScript.
- No package manager or build step. Do not add dependencies, backend, auth, or remote assets without approval.
- Use the bundled Node.js runtime when `node` is unavailable.

## Source Of Truth
- Product rules: `PRODUCT.md`.
- Canonical data proposal: `docs/CANONICAL_MODEL.md`.
- Responsive fusion plan: `PLAN_FUSION_CLARA_RESPONSIVE.md`.
- `app.js` is the complete Clara implementation; `claramente.js` is the guided prototype until both use a shared core.
- Verify live code before trusting older plans or handoff files.

## File-Scoped Commands
| Task | Command |
|---|---|
| Full static validation | `.\scripts\validate.ps1` |
| Static and E2E validation | `.\scripts\validate.ps1 -E2E` |
| Critical E2E suite | `.\scripts\test-e2e.ps1` |
| Visible E2E debugging | `.\scripts\test-e2e.ps1 -Headed` |
| JavaScript syntax | `node --check <file.js>` |

## Data And Security
- Store money as integer cents and distribute rounding remainders deterministically.
- Normalize imported, backup, hash, and localStorage data before use.
- Escape user-controlled text before rendering HTML.
- Preserve CSP, local-only assets, private-link key separation, and backwards-compatible links/backups.
- Bump the same `clara-cache-vN` value in `app.js`, `sw.js`, and `index.html` when public assets change.

## UX
- Claramente is the compact guided flow; Clara covers tablet and desktop shells.
- Device layout may change, but calculations and persisted state must not.
- Keep touch targets, keyboard focus, 200% text, contrast, and `prefers-reduced-motion` working.
- Use plain Spanish UI copy and keep money states understandable without color alone.

## Changes
- Write or update a failing test before changing behavior.
- Keep edits scoped; do not rewrite user-modified plans or untracked handoff files.
- Run static validation after every code change and E2E after user-visible or calculation changes.
- Do not publish internal plans unless explicitly requested.

## Commit Attribution
AI commits MUST include:
`Co-Authored-By: Codex <noreply@openai.com>`
