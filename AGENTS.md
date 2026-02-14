# AGENTS.md

## Project Overview

This repository is `ink-note`, a React + TypeScript app for node-based note taking, backed by Convex and authenticated with Clerk.

- Frontend: Vite, React 19, TypeScript, Tailwind CSS 4
- Backend: Convex functions + schema in `convex/`
- Auth: Clerk on the client, Clerk JWT issuer in Convex
- UI state: Zustand
- Rich editor: TipTap with mentions

## Core Commands

Use `pnpm` for all package and script operations.

- Install deps: `pnpm install`
- Start frontend: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Preview build: `pnpm preview`
- Run Convex dev backend/codegen: `npx convex dev`

## Required Environment

Client env vars (in `.env.local`):

- `VITE_CONVEX_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`

Server env var (Convex runtime):

- `CLERK_JWT_ISSUER_DOMAIN`

## Architecture Map

- App entry and providers: `src/main.tsx`
- Auth gating and workspace shell: `src/App.tsx`
- Notes model/context + Convex integration: `src/features/notes/useNotesModel.tsx`
- Convex schema: `convex/schema.ts`
- Convex note logic: `convex/notes.ts`
- Workspace UI state: `src/store/useWorkspaceUiStore.ts`
- Graph indexing logic: `src/store/graphIndex.ts`
- Shared types: `src/types/index.ts`

## Code Conventions To Follow

### Imports and paths

- Prefer `@/` alias for app code under `src/`.
- Keep Convex-generated imports from `convex/_generated/*`.
- With `verbatimModuleSyntax: true`, use `import type` for type-only imports.

### TypeScript and lint expectations

- Keep strict typing; avoid `any` unless unavoidable.
- Respect `noUnusedLocals` and `noUnusedParameters`.
- Keep code compatible with `erasableSyntaxOnly` (avoid non-erasable TS constructs).

### React and state patterns

- `useNotesModel` must only be used under `NotesModelProvider`.
- Use `useWorkspaceUiStore` for focus/z-index state, not ad hoc globals.
- Follow existing async style: fire-and-forget event handlers use `void someAsyncCall()`.

### Styling and UI

- Tailwind CSS 4 is used via `@tailwindcss/vite` and `src/index.css`.
- Reuse `cn()` from `src/utils/cn.ts` for class merging.
- Theme is controlled via `document.documentElement.dataset.theme` with `light`/`dark`.

## Convex Rules

- Do not edit files in `convex/_generated/` manually.
- Keep validators and schema aligned when changing note data shape.
- If you change Convex functions/schema, run `npx convex dev` to refresh generated types.
- Auth-protected handlers should continue using the existing `requireUserId` pattern.
- Note IDs are user-scoped and collision-checked (`by_user_noteId` index).

## Behavior-Sensitive Areas

- `useNotesModel` debounces content/title updates before mutation; preserve this behavior.
- Before close/delete/id-change operations, pending updates are flushed; do not bypass this.
- Mention links are stored in note content as `data-id="<noteId>"`, and connections are derived from content.
- `changeNoteId` updates cross-note references; changes here can affect graph and mention consistency.

## Editing Guardrails For Agents

- Make minimal, targeted changes consistent with existing style.
- Avoid broad refactors unless explicitly requested.
- Do not introduce new tooling/frameworks without user approval.
- Prefer extending existing patterns/components over parallel implementations.
- Keep comments brief and only where code intent is non-obvious.

## Validation Checklist After Changes

After substantive edits, run:

1. `pnpm lint`
2. `pnpm build` (for type + build validation)
3. If Convex files changed: `npx convex dev` (or ensure generated artifacts are updated)

Report any command failures clearly with likely cause and next fix step.

## Known Gaps

- No formal test suite is currently configured (no `test` script).
- Default root `README.md` is template-level; rely on source/config for project truth.
