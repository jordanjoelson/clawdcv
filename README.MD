# clawdcv

**Resume editor you talk to.** You say what you did. Robot writes the bullet, counts the pixels, and keeps it on one clean page. Name is `Claude` + `CV`. Yes.

It runs on your machine. Your resume never leaves it.

---

## What this is

A local resume tool. Three moving parts:

1. **`resume.yaml`** — your resume, as plain text you (or the agent) edit.
2. **The browser** — draws it live as *Jake's Resume*, the single-column template recruiters know on sight.
3. **`geometry.json`** — after every save, the page gets *measured*: does each bullet fill its line? does it all fit one sheet? Real pixels, not vibes.

You talk to an AI agent (Claude Code) like a person — *"add my new job," "shorten the NASA bullet," "trim it to one page"* — it edits `resume.yaml`, the page reloads, it reads the measurements, and it fixes what's off. You can also just hand-edit `resume.yaml` yourself. Both work.

## Why you want it (and not the other tools)

Other resume sites want your email, your data, and $15/month to let you download your own resume. clawdcv wants none of that.

- **Stays on your machine.** No account, no upload, no "we improved your resume (and kept a copy)." Local-first. Your data is yours.
- **It measures, you don't squint.** Most tools (and most humans) eyeball whether a line looks full or whether it spilled to page 2. Here a robot checks every bullet to the pixel and refuses to leave dead space or a phantom second page.
- **What you see is the PDF.** Screen page count == downloaded page count. No nasty surprise when you hit export.
- **It writes like a recruiter wants, not like a thesaurus.** The agent follows an actual philosophy (see `philosophy.md`): impact first, real numbers, strong verbs, ATS-safe, no buzzword soup. It pushes back if you ask it to keyword-stuff.
- **Talk, don't fill forms.** No 40-field wizard. You describe the job, it shapes the bullets and tunes the layout.
- **Free and open.** It's your resume. Downloading it should not cost money.

## Setup

You need **Node 20+** and **npm**.

```bash
git clone <this-repo>
cd clawdcv
npm install
npm run dev
```

Open **http://localhost:3000**. You see your resume. Leave that tab open — it redraws itself every time `resume.yaml` is saved.

## How you use it

**Talk to it.** Open the project in Claude Code (or your agent of choice) and just say what you want:

> "Here's my LinkedIn dump — build my resume."
> "Add a Certifications section."
> "Make the projects punchier and keep it one page."

It edits `resume.yaml`, watches `geometry.json`, and gets every bullet to ≥95% line-fill on one page.

**Or edit by hand.** Open `resume.yaml`, change words, save. The browser reloads and rewrites `geometry.json` so you can see what fit and what didn't.

**Export.** Hit the export button on the page. Out comes a clean PDF with a recruiter-friendly filename.

## How it works (the loop)

```
you edit resume.yaml  ->  browser redraws  ->  geometry.json updates  ->  agent reads it  ->  fixes -> repeat
```

`geometry.json` is the smart part. For every bullet it reports the line-fill %, how many lines, and pixels remaining. It flags anything under 95% or any page overflow. Bold keywords (`**like this**`) are measured at their *real* bold width, so a near-full line never silently wraps. Page math matches the PDF exactly.

## Templates and preferences

Set these in **`profile.yaml`**:

- **`template`** — `jake` (Calibri, roomy, the classic — default) or `compact` (Georgia, denser, fits more on one page). Each template brings its own font.
- **`boldKeywords`** — `true` renders `**bold**` markers in bullets as bold; `false` strips them to plain text.

Sections are flexible: contact (with optional website), education (with coursework / leadership), experience, projects, free-form skill groups (any labels you want), and a closing list section whose heading you name (`honorsTitle` — "Honors," "Leadership," "Awards," whatever).

## The files

| File | What it's for |
|------|---------------|
| `resume.yaml` | Your resume content. The thing you edit. |
| `profile.yaml` | Look & feel: template, bold keywords. |
| `geometry.json` | Generated. The live layout measurements. **Don't edit it.** |
| `philosophy.md` | How good bullets get written (the agent reads this). |
| `CLAUDE.md` / `AGENTS.md` | Instructions for the AI agent. |

## Stack

Next.js 16 + React 19, TypeScript, Tailwind. Layout measured with [`@chenglou/pretext`](https://www.npmjs.com/package/@chenglou/pretext). PDF export via Puppeteer. No database, no cloud, no telemetry.

---

Built to make one good page, fast, without handing your life story to a website. That's it. Go get the job.
