@AGENTS.md
@philosophy.md

# Resume Editor

This is a local-first resume tool. The user talks to you to edit their resume. You edit `resume.yaml`, the browser renders it live as Jake's Resume template, and `geometry.json` tells you the layout state after each render.

## Workflow

1. Read `geometry.json` before making any edits — it contains the current layout state measured by Pretext in the browser
2. Read `resume.yaml` to understand current content
3. Make edits to `resume.yaml`
4. The browser hot-reloads on save and regenerates `geometry.json` — **rely on the user's open browser for this. Do NOT spin up a headless browser to force a render as a matter of course** — it's slow and usually redundant.
5. Confirm the refresh landed: the bullet `text` values in `geometry.json` should match what you just wrote. If they still show the OLD text, the page isn't rendering (no open/focused tab) — that's the *only* time to fall back to a one-off headless render, or just ask the user to open/refocus `localhost:3000`. Detect staleness; don't pre-empt it.

## Shaping the template to the user's content

The template is the user's to shape, not a fixed mold — but stay efficient about it. When the user gives content that doesn't map to an existing section (Honors & Activities, awards, publications, a personal website, leadership, certifications), **don't silently invent a section or silently drop the content.** Surface the choice in one quick question: keep it as its own new section, fold it into an existing section, or leave it out. Then act.

Optional building blocks already wired up (offer these when the user's content calls for them): a contact `website`, education `leadership`, free-form `skills` groups (`{label, items}`), and a closing list section (`honors`) whose **heading is the user's to name** via `honorsTitle` — it is NOT fixed to "Honors & Activities"; set it to "Leadership", "Awards", "Activities", or whatever fits their content. Adding a genuinely new *kind* of section still means updating `app/types.ts` + `app/components/ResumeContent.tsx` (see "What to avoid"). Once a section exists, remember it's there — keep tracking it across edits rather than re-deciding it each time.

## Layout constraints

- **Font:** 14.67px Calibri (11pt) in a 720px wide content area
- **Bullet target:** fill the *last* line to ≥95% — no wasted real estate. Bullets are 1 line by default; multiple lines are fine when the user asks, as long as the last line still hits ≥95%. `geometry.json` reports `fill` as the **last-line** fill and `lines` as the count — trust it, not your intuition about character counts
- **Non-bullet lines are preference, not a rule:** skills rows, education details (coursework/leadership), and honors lines appear in `geometry.json` under `fillLines` with their own `fill` %, but they are **not** held to the 95% target and never raise a warning. Only tighten them *toward* full when the user explicitly asks; otherwise list exactly what the user gave. They may run short, and they're freer to wrap. (Bullets = strict 95%; everything else = the user's call.)
- **Bold keyword width:** `**bold**` runs render at weight 700 and are **wider** than plain text; geometry measures them at 700 (Pretext `rich-inline`). A bullet near 95% can therefore still wrap once bold is added — trust `lines` in `geometry.json`, and re-check after adding/removing `**markers**`.
- **Page:** 8.5" × 11" (1056px at 96dpi). `geometry.json` reports `page.contentHeight` vs `page.capacity` (the page-1 printable height) and `page.remaining` — keep `remaining` positive. These numbers match BOTH the on-screen page count and the **downloaded PDF**; if the resume shows one page in geometry it is one page in the PDF.
- **Line height:** ~18.33px (reported live in `geometry.json` under `lineHeight`)

## geometry.json structure

```json
{
  "font": "14.67px Calibri",
  "containerWidth": 720,
  "lineHeight": 18.33,
  "page": {
    "contentHeight": 965,
    "capacity": 1008,
    "remaining": 43
  },
  "experience": [
    {
      "company": "Company Name",
      "bullets": [
        { "i": 0, "text": "...", "lines": 1, "fill": 0.96 }
      ]
    }
  ],
  "projects": [...],
  "fillLines": [
    { "section": "skills", "label": "Languages", "fill": 0.34, "lines": 1 }
  ],
  "warnings": []
}
```

`warnings` is pre-computed — any **bullet** whose last line is under 95%, or page overflow, will appear there. Check it first. `fillLines` (skills/education/honors) carry a `fill` % for reference but never warn — see "Non-bullet lines are preference" above.

`page.capacity` is the page-1 printable height (sheet minus the top margin; the PDF drops page 1's bottom margin, so its content can run nearly to the sheet edge). On-screen pagination uses the same budget, so **screen page count == PDF page count** — don't reintroduce a separate page-1 bottom-margin reservation, or the two diverge.

## Sizing a bullet to ≥95% in one pass

Don't guess character counts and iterate 2–3 times. `geometry.json` carries the width data to size an edit so it usually lands on the **first** try. This only sets *how many* characters to add — *what* you write is still governed by `philosophy.md` (impact-first, real specifics, never invent numbers). So it cuts render cycles without touching bullet quality or the ≥95% bar.

It's a calibrated **estimate, not a formula**: the font is proportional (an `i` is ~⅓ the width of a `w`), so `cpx` is an *average* and the exact words you add will run a bit wider or narrower. It converges well because the bullet and your addition are both English prose (hence the tight ±3% spread across real bullets), but a short or glyph-heavy addition can miss. The 0.97 target (step 3) is the buffer for that, and the render check (step 6) is the source of truth — this reduces passes, it doesn't promise exactly one.

1. For the bullet, read `width` (px of its last line) and the top-level `containerWidth`. Count `n` = characters of the bullet text **with `**` markers stripped**.
2. **Self-calibrate** the font's average char width from this very bullet: `cpx = width / n`. This adapts to the active font automatically (Calibri ≈ 6.0px; the compact Georgia ≈ 4.8px) — so never hardcode a px/char constant, just compute it per bullet.
3. Aim for the **middle of the safe band**, fill ≈ **0.97** (not 0.95): `targetWidth = 0.97 × containerWidth`. Centering at 0.97 leaves ~±2% (~±2 chars) of tolerance that absorbs the glyph-width variance of whatever words you add, so you clear 0.95 without risking a wrap (fill > ~1.0). **Nudge within the band by what you're adding:** aim lower (~0.96) when the new words are glyph-wide (capitals, `m`/`w`/`W`, `%`, `&`, `@`); aim higher (~0.98) when they're glyph-narrow (`i`/`l`/`t`/`f`/`r`, spaces, punctuation). The shorter the addition, the more this matters.
4. Characters to add ≈ `(targetWidth − width) / cpx`. (≤ 0 ⇒ already full enough; leave it.)
5. Write a truthful elaboration of roughly that length (±2 chars). Added words are usually plain (non-bold) and a hair narrower than `cpx` when the bullet has bold runs, so this errs slightly short — which is the safe direction (won't wrap).
6. Re-render only if the result still shows `fill < 0.95` or `lines > 1`. Most bullets land in one pass.

Worked example (Calibri): a bullet at `width` 589, `containerWidth` 701, `n` 96 → `cpx` 6.1. Target 0.97 → 680px → add `(680 − 589) / 6.1 ≈ 15` chars of real detail. Done — no second pass.

## What to avoid

- Font, font size, and container width are auto-detected: `GeometryCapture.tsx` reads them from the rendered DOM and measures Pretext's per-font calibration live against a hidden probe. Change the CSS freely — the measurements follow. (`geometry.json` echoes the active `font` and `calibration` so you can confirm it adapted.) Just don't reintroduce a hardcoded font/calibration constant
- Do not add new sections or structural changes to the YAML without updating `app/types.ts` and `app/components/ResumeContent.tsx` (where the sections actually render; `Resume.tsx` just delegates). New fill-able non-bullet lines should get `data-fill-line` / `data-fill-section` / `data-fill-label` so they appear in `fillLines`.
- Do not edit `geometry.json` directly — it is generated on every page load
