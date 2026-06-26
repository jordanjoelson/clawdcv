<p align="center">
  <img src="public/assets/clawdcv.png" alt="clawdcv" width="160">
</p>

# clawdcv

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green.svg"></a>
  <img alt="Built with Claude Code" src="https://img.shields.io/badge/Built%20with-Claude%20Code-D97757?logo=anthropic&logoColor=white">
  <a href="AGENTS.md"><img alt="Works with any agent" src="https://img.shields.io/badge/agents-AGENTS.md-555"></a>
  <img alt="Node 20+" src="https://img.shields.io/badge/Node-20%2B-339933?logo=nodedotjs&logoColor=white">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-38B2AC?logo=tailwindcss&logoColor=white">
</p>

<p align="center">
  <a href="#setup">Setup</a> ·
  <a href="#how-to-use-it">Usage</a> ·
  <a href="CONTRIBUTING.md">Contributing</a> ·
  <a href="philosophy.md">Philosophy</a>
</p>

**A resume editor you talk to. Your resume never leaves your machine. It measures the page to the pixel. No account, no subscription.**

You tell it what you did, and it writes the bullet point, measures the page, and keeps everything on one clean page. It's built for **Claude Code** and works with any coding agent (Cursor, Codex, Gemini CLI, and others), and you can edit the file by hand too. The name just comes from "Claude" plus "CV."

---

## What this is

This is a resume tool that runs locally on your machine. It has three main parts:

1. **`resume.yaml`**: your resume, written as plain text. You can edit it yourself, or let the agent edit it for you.
2. **The browser**: shows your resume live, drawn as *Jake's Resume*, the single-column template that recruiters recognize right away.
3. **`geometry.json`**: every time you save, the page gets measured. It checks whether each bullet fills its line and whether everything still fits on one page. These are real pixel measurements, not guesses.

You talk to an AI agent (Claude Code by default, or another like Cursor or Codex) the way you'd talk to a person, for example *"add my new job,"* *"shorten the NASA bullet,"* or *"trim it to one page."* The agent edits `resume.yaml`, the page reloads, it reads the new measurements, and it fixes whatever is off. If you'd rather, you can also just edit `resume.yaml` yourself. Both ways work.

## Why you might want it

A lot of resume websites ask you to make an account, hand over your data, and pay every month just to download your own resume. This tool doesn't do any of that.

- **It stays on your machine.** There's no account to create and nothing gets uploaded. Your data stays yours.
- **It measures the layout so you don't have to.** Most tools leave you to eyeball whether a line looks full, or whether your text quietly spilled onto a second page. Here the agent checks every bullet down to the pixel, so you don't end up with awkward empty space or an accidental second page.
- **What you see is what you download.** The number of pages on screen matches the PDF you export, so there are no surprises at the end.
- **It writes the way recruiters expect.** The agent follows a clear set of writing rules (see `philosophy.md`): lead with impact, use real numbers, start with strong verbs, and stay readable for the applicant tracking systems that scan resumes. If you ask it to stuff in keywords, it will push back.
- **You talk to it instead of filling out forms.** There's no long form to work through. You describe the job, and it writes the bullets and adjusts the layout.
- **It's free and open.** It's your resume, and downloading it shouldn't cost anything.

## Setup

You'll need **Node 20 or newer** and **npm**.

One line that scaffolds a fresh copy (resume content plus agent instructions) into `my-resume/` and starts the dev server:

```bash
npx degit jordanjoelson/clawdcv my-resume && cd my-resume && npm install && npm run dev
```

Or clone it the usual way:

```bash
git clone https://github.com/jordanjoelson/clawdcv.git
cd clawdcv
npm install
npm run dev
```

Open **http://localhost:3000**. You'll see your resume. Keep that tab open and visible on screen, since it redraws itself every time `resume.yaml` is saved.

## How to use it

You can use it in two ways.

**Talk to it.** The simplest way — no terminal required — is the **Claude Code desktop app** (Mac/Windows; see the [Claude Code docs](https://docs.claude.com/en/docs/claude-code) to download). Open this project folder in it and just chat — it can even run the `npm install` and start the live preview for you if you ask. Then say what you want:

> "Here's my LinkedIn dump, build my resume."
> "Add a Certifications section."
> "Make the projects clearer and keep it on one page."

**Prefer the terminal?** *(Skip this if you're using the desktop app.)* Install the CLI with `npm install -g @anthropic-ai/claude-code`, then run `claude` from the project folder.

Either way, Claude Code asks before it edits a file or runs a command — just approve each one. Once you're comfortable and want fewer prompts, you can start the CLI with `claude --dangerously-skip-permissions`, which lets it work without stopping to ask; only use that when you trust what it's doing.

Other coding agents work too: install [Codex](https://github.com/openai/codex) (`npm install -g @openai/codex`, then run `codex`), or use Cursor, Gemini CLI, or anything that reads `AGENTS.md`. They pick up the same workflow from `AGENTS.md`, which points them at the operating manual in `CLAUDE.md` and `philosophy.md`.

The agent edits `resume.yaml`, watches the measurements in `geometry.json`, and adjusts each bullet until it fills at least 95% of its line and the whole resume fits on one page.

**Edit it by hand.** Open `resume.yaml`, change the text, and save. The browser reloads and updates `geometry.json`, so you can see what fit and what didn't.

**Export it.** Click the export button on the page. You get a clean PDF with a sensible, recruiter-friendly filename.

**Then apply early.** Postings get the most attention from recruiters in their first day or two, so the sooner you apply the better. [intern-list.com](https://www.intern-list.com/) lists newly posted internships as they go up, and [JobRight](https://jobright.ai/) can autofill applications from your resume. Tailor a copy here, export it, and carry it straight into those applications while the posting is still fresh.

**Track where you applied.** Ask the agent to track your applications and it keeps an `applications.yaml` for you: one entry per company, with a status (todo → applied → interview → offer → rejected) linked to the exact tailored resume and cover letter you sent. You drive it by chat (*"applied to Astranis," "what's still todo?," "Tesla rejected"*) and can ask for a table any time. Saving a variant or exporting a PDF for a company logs it as `todo`; only you confirming marks it `applied`. Like your resume, it stays on your machine.

## How it works (the loop)

```
you edit resume.yaml  ->  browser redraws  ->  geometry.json updates  ->  agent reads it  ->  fixes -> repeat
```

`geometry.json` is the part that makes this work. For every bullet, it reports how much of the line is filled, how many lines it uses, and how many pixels are left. It flags any bullet under 95% full and any page that overflows. Bold keywords (written as `**like this**`) are measured at their actual bold width, so a nearly-full line won't quietly wrap once a word is bolded. The page math matches the exported PDF exactly.

## Templates and preferences

You set these in **`profile.yaml`**:

- **`template`**: the layout to render in (each one bundles its own font). Pick one:
  - `jake`: the classic single-column template recruiters recognize on sight, in Calibri. Roomy and traditional. The default; best for students and new grads.
  - `compact`: a denser Georgia variant with justified bullets. Best when you have a lot to fit on one page.
  - `cns`: the UT Austin College of Natural Sciences format (Calibri 12pt, centered name, underlined headings). For UT Austin CNS or other STEM undergrads who want their advisors' standard layout.
  - `business`: the UT Austin McCombs business format (Times New Roman, centered name, rule-underlined headings). For business, finance, or consulting applicants who want a classic serif resume.
  - `modern`: "Modern Accent," a sans-serif look with teal headings, plus an optional Professional Summary and a Core Competencies pill grid. Contemporary but still ATS-safe.
  - `professional`: an experience-first layout for graduates, leading with Experience and condensing Education to one line at the bottom. For when your work matters more than your degree.
  - `jake-pro`: the classic Jake look with the experience-first post-grad ordering. For Jake fans who've graduated.
- **`boldKeywords`**: `true` renders the `**bold**` markers in your bullets as bold text; `false` strips them out to plain text.
- **`pages`**: `single` keeps everything on one page (the default, and what most students and new grads want); `multi` lets your resume run onto more pages, adding a small running header (your name and "Page X of Y") to each page after the first.

**Bring your own template.** The seven above aren't a fixed menu. You can ask the agent to add your own: describe the look you want (font, colors, spacing, how the name and section headings sit) or point it at a resume style you like, and it wires up a new template you then select with `template: <name>` in `profile.yaml`. You don't have to think about the measurements. The layout engine reads the font and column width live from the rendered page, with no hardcoded numbers, so a new template calibrates itself and the same one-page and 95%-fill checks apply automatically. For example: *"add a template with a serif font, a centered name, and tighter spacing, then switch to it."*

The sections are flexible: an optional Professional Summary and a Core Competencies grid (used by the `modern` template), contact (with an optional website and location), education (with optional coursework, leadership, and awards lines), experience, projects, free-form skill groups with any labels you want, an optional Leadership / Community Involvement section, and a closing list section whose heading you choose (`honorsTitle`: "Honors," "Leadership," "Awards," or whatever fits). Most section headings are renamable too (`experienceTitle`, `skillsTitle`, `competenciesTitle`, `leadershipTitle`, `honorsTitle`), so you can match a specific format.

## The files

| File | What it's for |
|------|---------------|
| `resume.yaml` | Your resume content. The main thing you edit. |
| `profile.yaml` | Look, feel, and length: template, bold keywords, single or multi page. |
| `coverletter.yaml` | Optional cover letter. Renders as its own page in the same template; exports separately or merged with the resume. Personal, stays local. |
| `applications.yaml` | Optional tracker the agent keeps: which companies you applied to and where each stands. Personal, stays local. |
| `geometry.json` | Generated automatically. The live layout measurements. **Don't edit it.** |
| `philosophy.md` | How good bullets get written (the agent reads this). |
| `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` | Instructions for the AI agent (any agent finds its way to the same manual). |

## Stack

Built with Next.js 16 and React 19, TypeScript, and Tailwind. The layout is measured with [`@chenglou/pretext`](https://www.npmjs.com/package/@chenglou/pretext). PDF export uses Puppeteer, with `pdf-lib` adding the headers on multi-page resumes. There's no database, no cloud, and no tracking.

---

The goal is simple: help you make a clean, well-measured resume, quickly, while keeping all your information on your own computer.
