@AGENTS.md
@philosophy.md

# Resume Editor

This is a local-first resume tool. The user talks to you to edit their resume. You edit `resume.yaml`, the browser renders it live as Jake's Resume template, and `geometry.json` tells you the layout state after each render.

## Talking to the user

Be concise. Lead with the answer in a sentence or two; expand only when genuinely explaining something. No five-paragraph walls of text — they overwhelm people and deter use. Prefer a short list or one tight paragraph over many. Say the concrete action, not jargon (e.g. "make the `localhost:3000` window visible," never "refocus").

**No em dashes in the resume or in application/cover text you write for the user.** They read as an AI tell. Use commas, colons, periods, or parentheses (preferred) instead; keep en-dashes only inside numeric ranges (e.g. "10-15%"). This is about the documents you produce, not this chat: conversational replies to the user can use any punctuation.

## Workflow

1. Read `geometry.json` before making any edits — it contains the current layout state measured by Pretext in the browser
2. Read `resume.yaml` to understand current content
3. Make edits to `resume.yaml`
4. The browser hot-reloads on save and regenerates `geometry.json` — **rely on the user's open browser for this. Do NOT spin up a headless browser to force a render as a matter of course** — it's slow and usually redundant.
5. Confirm the refresh landed: the bullet `text` values in `geometry.json` should match what you just wrote. If they still show the OLD text, the page isn't re-rendering — that's the *only* time to fall back to a one-off headless render, or just ask the user to bring the page back on screen. Detect staleness; don't pre-empt it.

   **Visible, not focused.** The page reloads as long as the `localhost:3000` window is *visible* on screen. It does NOT need to be the focused/clicked window. Two monitors is the normal case: the browser sits on one monitor while the user clicks into the terminal on the other — the browser is unfocused but still visible, so it keeps reloading fine. The only thing that breaks it is the window being **minimized or fully hidden behind another window** (browsers freeze hidden tabs). So never tell the user to "refocus" or "click into" the browser. Say the concrete action: **"make sure the `localhost:3000` window is visible on screen (not minimized or covered)."**

## Saving and tailoring resume versions

Keep one **base** resume and save each **tailored** copy as its own file, so the user can cross-reference phrasing across versions — a sharp bullet written for one job often improves the base or another tailored copy. The convention:

- **`resume.yaml`** — the active file the browser renders. Always edit this one.
- **`resume.mine.yaml`** — the user's base/general resume (their canonical content).
- **`resume.<slug>.yaml`** — one saved variant per job/company/role (e.g. `resume.tesla.yaml`).

Before re-gearing the active resume for a new target, **save the current `resume.yaml` to a named variant first** so nothing is lost, then edit. To switch versions, copy the wanted file over `resume.yaml` and re-render. Every variant is gitignored (personal, via `resume.*.yaml`); only `resume.yaml` is tracked. When the user finishes a tailored pass, **offer to save it as `resume.<slug>.yaml`** — don't let good tailored content live only in the working file where the next re-gear overwrites it.

## Cover letters

A cover letter is optional and lives in **`coverletter.yaml`** (personal, gitignored like resume variants; tailored copies are `coverletter.<slug>.yaml`). It renders as its **own page** in the active resume template's font, so a combined PDF reads as one cohesive document. The shape is a formal address-block letter: `sender` (name defaults to the resume's; `lines` are address/contact lines), `date`, `recipient` (name/title/company + extra `lines`), `greeting` (defaults to "Dear Hiring Manager,"), `body` (a list of paragraphs, **bold** honored), `closing` (defaults to "Sincerely,"), and `signature`. Only `body` is required; omit the rest and it's left out.

- **Writing it:** generate a **general** letter from the resume, or **tailor** it when the user drops a job posting (pull the role's real keywords into the body where true, per `philosophy.md`). Same honesty/no-fabrication rules as the resume. **No em dashes** (this is application text the user submits).
- **Length:** keep it to one page. `geometry.json` gains a `coverLetter` block (`contentHeight`, `capacity`, `remaining`, `linesRemaining`, `fits`) and a warning when it overflows — trim until `fits` is true. Body paragraphs are **prose, not bullets**, so they are NOT held to the ≥95% fill rule.
- **Preview & export:** the browser shows the resume and the cover letter stacked. The Save-PDF menu gains three options once `coverletter.yaml` exists: **Resume**, **Cover letter**, and **Resume + Cover letter** (the combined file renders each separately and concatenates them, so the cover-letter page carries **no** resume continuation header). Until a cover letter exists, the export button behaves exactly as before.
- **Saving variants:** like resumes, offer to save a finished tailored letter as `coverletter.<slug>.yaml`, and copy the wanted file over `coverletter.yaml` to switch.

## Application tracker

`applications.yaml` (personal, gitignored like resume/cover variants) tracks which companies the
user is targeting and where each stands. It is **chat-driven with no UI** — the user talks
("applied to Astranis", "what's still todo?", "Tesla rejected") and you keep the file in sync. One
entry per company/role: `company`, `role`, `status`, `variant` (the tailored-files slug), `applied`
(date), `link` (posting), `notes`.

- **Status funnel:** `todo → applied → interview → offer → rejected`. `todo` = tailored/prepped but
  not yet submitted. **Saving a variant or exporting a PDF is NOT applying** — never infer `applied`
  from a file existing; only the user confirming sets it (and the `applied:` date).
- **How you find out / when you ask** (the two ways status enters the file):
  - *From the user:* they tell you ("applied to X", "X rejected", "interview at Y") — update on that.
  - *Auto-log (agent-driven, the only automatic part):* whenever you save a tailored
    `resume.<slug>.yaml` / `coverletter.<slug>.yaml` or export-name a company PDF, add/update a
    `todo` entry for that company **in the same step**, then mention it in one line. This captures
    the target the moment it's known so nothing slips between tailoring and applying.
  - *When to ask:* after finishing a tailoring pass for a company, confirm in ONE line whether to
    mark it `applied` or leave `todo` — ask once, don't nag. When the user asks "where am I / what's
    left", read the file back grouped by status.
- **Dedup by company/slug:** if an entry already exists, update it — never add a duplicate.
- **Variant link:** set `variant` to the slug so each application points at the exact resume + cover
  letter that went out.

Not built yet (deliberate next steps, not part of v1): a browser table view, and app-side
auto-logging from the export button (would need an `/api/applications` POST route, mirroring how
`/api/geometry` writes its file). v1 is the file plus the rule above.

## Shaping the template to the user's content

The template is the user's to shape, not a fixed mold — but stay efficient about it. When the user gives content that doesn't map to an existing section (Honors & Activities, awards, publications, a personal website, leadership, certifications), **don't silently invent a section or silently drop the content.** Surface the choice in one quick question: keep it as its own new section, fold it into an existing section, or leave it out. Then act.

Optional building blocks already wired up (offer these when the user's content calls for them): a contact `website`, education `leadership`, a project `url` (repo or live-demo link that makes the project name clickable in the page and the PDF — **proactively ask the user for repo/demo links**; if they don't have a specific link for a project, offer to point its name at their GitHub profile instead), free-form `skills` groups (`{label, items}`), and a closing list section (`honors`) whose **heading is the user's to name** via `honorsTitle` — it is NOT fixed to "Honors & Activities"; set it to "Leadership", "Awards", "Activities", or whatever fits their content. **Compatible shape vs new shape:** the shapes already rendered are *entries-with-bullets* (Experience, Projects) and *labeled/plain lists* (Skills groups, the honors list). A new section that matches one of these (Volunteer ≈ entries; Certifications/Awards/Leadership ≈ list) is essentially data — it reuses an existing renderer, so don't treat it as designing something new. The schema still names sections individually today, so wiring a second one of the same shape is a *small* `app/types.ts` + `app/components/ResumeContent.tsx` touch (a generic repeatable-sections model — which would make these pure `resume.yaml` — isn't built yet). Only a genuinely **new shape/layout** is substantive new code. Once a section exists, remember it's there — keep tracking it across edits rather than re-deciding it each time.

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
    "contentHeight": 917,
    "capacity": 960,
    "remaining": 43,
    "linesRemaining": 2
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

`page.capacity` is the page-1 printable height = **sheet minus a standard 0.5in margin on BOTH top and bottom** (1056 − 48 − 48 = 960 for the default template). Page 1 reserves a real bottom margin so it reads like a standard resume, not content running to the sheet edge. Screen and PDF stay in lockstep (**screen page count == PDF page count**) because the bottom margin is reserved in three places at once: `PageLayout`'s page-1 budget, `GeometryCapture`'s `capacity`, and `@page :first` in `globals.css`. If you ever change the page margin, change all three together — they must agree, or screen and PDF diverge.

`page.linesRemaining` is the quick answer to "how many more lines can I add to page 1?" — it's `remaining` floored to whole line-heights (conservative; `0` when the page is full or overflowing). Read it straight off `geometry.json`; no need to divide `remaining` by `lineHeight` yourself.

**Multi-page continuation headers.** Page 2+ get a slim running header (name left, "Page X of Y" right, rule under) — `RunningHeader` in `ResumeContent.tsx`, styled from the template `--vars` so it adapts to any template. Page 1 keeps its full masthead only. Mechanics: `PageLayout` tags each section/entry with `data-block-key`, computes the page breaks, and maps each continuation page's start back to its block key; the print flow (card 0) then injects a `.printPageStart` (running header + `break-before: page`) before those blocks, so the PDF breaks at the exact same boundaries as the on-screen cards (screen == PDF). Continuation pages reserve the header's measured height in their budget (`contBudget`). It's fully gated on `numPages > 1`, so single-page resumes are byte-identical to before — do not let a refactor make a one-page resume render a header.

**`profile.pages` — single vs multi.** `profile.yaml` carries a length preference (`single`, the default, or `multi`). It doesn't change rendering — it's *your* intent signal: in `single` mode, treat a `page overflows` warning as something to **fix** (trim/tighten until it's one page); in `multi` mode, overflow is fine and the continuation header handles page 2+. The conversational intake should **ask** this when building a profile, defaulting to single.

**Intake: target a specific job or general?** When building a profile, also **ask up front whether the resume is for a specific job or a general one.** If specific, take the posting (paste or link) and tailor to it — extract the real keywords and weave them in where true, per *Tailoring to a job posting* in `philosophy.md`. If general, write for the broad target role. Asking before writing means bullets get tailored on the first pass instead of reworked later. (This is intent, not a rendered field; you don't need to store it in `profile.yaml`.)

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
- A section with a **new structural shape**, or any structural change to the YAML, means updating `app/types.ts` and `app/components/ResumeContent.tsx` (where sections actually render; `Resume.tsx` just delegates). A section that *reuses* an existing shape (entries-with-bullets, or a labeled/plain list) is light wiring, not a new shape — keep it minimal. New fill-able non-bullet lines should get `data-fill-line` / `data-fill-section` / `data-fill-label` so they appear in `fillLines`.
- Do not edit `geometry.json` directly — it is generated on every page load
