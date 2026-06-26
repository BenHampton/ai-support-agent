# UI — Ark Systems Support AI

Frontend-specific guidance. Auto-loaded when working under `packages/ui/`. See the root `CLAUDE.md` for shared project context, tech stack, company profile, and shared conventions.

## Conventions

### React
- **Functional components only**, no class components
- **Named exports** for all components
- **One component per file**, props typed with an explicit local `type Props`
- **No prop drilling beyond 2 levels** — use context or lift to a shared state

### Styling — CSS Modules + design tokens
- **CSS Modules for all component styles** — co-locate a `Component.module.css` next to each component, import it as `styles`, and reference classes via `className={styles.x}`
- **Design tokens in `packages/ui/src/styles/vars.css`** — shared/repetitive values (palette, semantic decision/tier/priority/confidence colors) are CSS custom properties (raw hex) on `:root`; reference them from module CSS via `var(--token)`. Don't hardcode repeated hex in component CSS.
- **Global CSS lives in `packages/ui/src/styles/`** — `global.css` (reset + base; `@import`s `vars.css`) is the only global stylesheet; no others.
- **Enumerable variants → modifier classes** — pick a class by value (e.g. ``className={`${styles.badge} ${styles[decision]}`}``) instead of computing colors in TS; keep color logic in CSS.
- **Inline `style` only for continuous runtime values** — e.g. the score-bar fill `width: ${score * 100}%`; nothing static goes inline.
- **Layering** — design tokens via CSS custom properties; the `styles/` split follows an ITCSS-style order: Settings (`vars.css`) → Generic (`global.css`) → component CSS Modules.

## Architecture Principles

- **Component-per-file, functional, named exports** — props typed with an explicit local `type Props`; co-locate small component-specific types.
- **State lives at the view orchestrator** — lift state to the view (`ChatView`, `SessionList`) and pass down as props; `useState` by default, no global store. Reach for context only when drilling would exceed 2 levels.
- **Single typed API boundary** — components never call `fetch` directly; all backend access goes through `packages/ui/src/api.ts`. Keep request/response shapes in sync with `@shared/types`.
- **Exhaustive event handling** — stream/SSE events are a discriminated union (`SseEvent`: `token` | `done` | `error`); handle every variant, never silently drop one.
- **Stable keys from domain ids** — key lists on real ids (`msg.id`, `kbMatchId`), never the array index.
- **Explicit loading & error states** — every async view surfaces both a pending state and a failure state in the UI; no silent failures.
- **Styles co-located via CSS Modules** — see the styling convention above.

## Industry Standards

- **Accessibility** — semantic HTML elements, labelled form controls, ARIA only where native semantics fall short, full keyboard operability and visible focus on interactive elements.
- **Strict typing** — no `any`; explicit prop and return types; prefer discriminated unions over boolean flags.
- **Hooks discipline** — follow the rules of hooks; correct effect dependency arrays; keep render pure, side effects only in effects/handlers.
- **Performance when measured** — memoize (`useMemo` / `useCallback` / `React.memo`) only for proven hot paths; avoid premature optimization.
- **Controlled inputs** and predictable one-way data flow.
- **Testing** — Vitest + React Testing Library for component behavior, per the locked stack.
