# Contributing to clawdcv

Thanks for your interest! clawdcv is a local-first resume editor: you edit `resume.yaml`, the
browser renders it live, and `geometry.json` reports the measured layout. Most contributions are
either **new templates** or improvements to the rendering/measurement engine.

## Getting started

You'll need **Node 20+** and **npm**.

```bash
git clone https://github.com/jordanjoelson/clawdcv.git
cd clawdcv
npm install
npm run dev
```

Open **http://localhost:3000** and keep the tab visible — it redraws and regenerates
`geometry.json` every time `resume.yaml` is saved.

## Project layout

| Path | What it does |
|------|--------------|
| `app/components/ResumeContent.tsx` | Renders the resume sections (where most layout logic lives). |
| `app/components/resume.module.css` | All template styling, via `[data-template="…"]` blocks. |
| `app/components/PageLayout.tsx` / `GeometryCapture.tsx` | Pagination + live pixel measurement. |
| `app/types.ts` | The `resume.yaml` schema and `TemplateName`. |
| `philosophy.md` | How bullets should be written (impact-first, real numbers, ATS-safe). |
| `CLAUDE.md` / `AGENTS.md` | Notes for the AI agent + layout/geometry rules. Read these first. |

Please read `CLAUDE.md` and `philosophy.md` before changing rendering or content rules.

## Adding a template

Most templates are a **styling variant** of the existing single-column shapes (entries-with-bullets,
labeled lists), which is light wiring — not new layout code:

1. Add the name to `TemplateName` in `app/types.ts` (plus a short doc comment).
2. Add a `[data-template="<name>"] .page { … }` block in `resume.module.css` overriding the CSS
   variables (font, sizes, spacing, accent colors). Don't touch page size or padding — the
   geometry/pagination math depends on them.
3. Add a one-line blurb in `profile.yaml` describing the look and who it's for, matching the
   existing entries.

A genuinely **new layout shape** (e.g. multi-column) is larger: it touches the geometry and
pagination model, and two-column layouts also tend to break ATS parsing — open an issue to discuss
before building one.

## Conventions

- **TypeScript**, and match the surrounding style (naming, comment density, idioms).
- Keep it **single-column and ATS-safe** unless a change is explicitly opt-in.
- **Don't edit `geometry.json`** — it's generated on every render.
- **Commit messages:** short, conventional (`feat:`, `fix:`, `docs:`, `refactor:`), no long
  enumerations. Do **not** add a `Co-Authored-By` trailer.
- `resume.yaml` and `profile.yaml` hold personal content — keep your own data out of commits.

## Pull requests

1. Branch off `main`.
2. Make sure `npx tsc --noEmit` passes and the app renders at `localhost:3000`.
3. Keep PRs focused; describe what changed and why.
