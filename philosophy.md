# Resume Writing Philosophy

How to write and edit the content in `resume.yaml` to maximize the chance of landing
interviews. These are content rules; the layout/line-fit rules live in `CLAUDE.md` and
`AGENTS.md`. Every bullet must satisfy *both*: read well **and** pass the geometry check
(1 line, ~95%+ fill — see `CLAUDE.md`).

## The bullet formula

Write every experience/project bullet as **impact first, then how** — the XYZ shape:

> Accomplished **[X, a measurable result]** by doing **[Z, the action/skill]**.

- Lead with the outcome or number, not the task. "Cut deploy time 40% by…" beats "Was responsible for deploys."
- One concrete result per bullet. Don't chain three duties into one line.
- Prefer a real metric. If no hard number exists, use scale/scope (counts, %, time, $, users, data size, team size, frequency).

**Before:** Worked on the data pipeline to help the team.
**After:** Cut nightly batch runtime 35% by rebuilding the ingestion pipeline in Django/Redis.

## Quantify as a theme

Numbers are the single biggest credibility lever, so make quantification a *theme* across the
resume, not a quota on every line. For each bullet ask *how much, how many, how fast, how often,
what scale?* and lead with the figure when a real one exists. Approximate honestly ("~", "500+",
"roughly") rather than leaving it vague; when no honest number exists, a strong verb plus concrete
scope stands on its own. Never invent precise figures the user can't defend in an interview, and
don't force a number where there isn't one.

## Verbs and word choice

- **Start with a strong past-tense action verb:** Built, Shipped, Designed, Cut, Drove, Automated, Led, Scaled, Migrated, Reduced, Launched.
- **Don't repeat the opening verb** across bullets — vary it. Three "Built…"s in a row reads as lazy and flattens the range of what you did; give each bullet a distinct, fitting verb.
- **Banned filler / weak openers:** "Responsible for", "Worked on", "Helped with", "Assisted in", "Tasked with", "Duties included", "Involved in".
- **Banned clichés / buzzwords:** team player, hard worker, results-driven, go-getter, synergy, detail-oriented, think outside the box, fast learner. Show these through results instead.
- Use the role's real vocabulary, not invented jargon.

## Voice and mechanics

- No first person and no pronouns (I, we, my). Bullets are implied-subject.
- Tense: **past** for past roles, **present** for the current role. Be consistent within an entry.
- Drop low-value articles ("a/the") when it tightens a line without hurting readability — this also helps the 1-line fit.
- Be specific over general: name the actual tech, system, or outcome.

## Keywords and ATS

- Mirror the **target role's** language. Pull skills/tools/verbs from the job postings being applied to and weave them in **naturally** where they're true.
- ATS parses plain text top-to-bottom (this template is single-column and ATS-safe), so what matters is that the right terms *appear in real, readable bullets* — in context, not a keyword dump.
- **Do not keyword-stuff.** Cramming terms for density reads robotically, and a human recruiter sees it. If a request drifts toward stuffing, push back and propose the impact-first version instead.
- Spell out then abbreviate on first use where ambiguous (e.g., "Continuous Integration (CI)") so both the human and the parser match.

## Competency signals: teamwork, communication, leadership, analytical

Recruiters and many ATS rubrics explicitly score for these competencies — not as buzzwords, but as evidence. Where each is genuinely true, surface it:

- **Teamwork:** name who you worked with and the shared outcome — "Partnered with 5 graduate students to…", "Collaborated across backend and design to…". Quantify the team size/scope.
- **Communication:** show the audience *and* the result — "Presented findings to a 6-member faculty committee, securing a second semester of funding", "Authored runbooks that cut onboarding from 3 weeks to 10 days".
- **Leadership:** show ownership and influence, not a title — "Led a 3-person team to…", "Drove the migration that…", "Mentored 2 junior devs", "Owned the rollout of…". Initiative counts even without direct reports.
- **Analytical focus:** show the reasoning and measurement, not just the build — "Analyzed X to identify…", "Benchmarked 3 approaches and chose…", "Diagnosed the bottleneck and cut latency 40%", "Modeled tradeoffs across…".
- Spread these across entries — evidence each at least once where it's real, but don't force all four into every bullet; that reads as stuffing (see Keywords and ATS).

## Readability and consistency (ATS + human screeners)

Screeners — human and software — skim top-down, so make the signal easy to extract and consistent:

- **Bullet length:** one line per bullet (per the geometry rules in `CLAUDE.md`), and keep bullets roughly even in length. A giant bullet next to a one-word stub reads as careless.
- **Consistent punctuation:** pick one rule and apply it to *every* bullet. Default here: **no terminal periods** (bullets are fragments). Whatever the choice, it must be uniform across the whole resume.
- **Consistent verb tense:** every bullet opens with a strong action verb; **past tense for past roles, present for the current role**, never mixed within an entry (see Voice and mechanics).
- **Front-load the keyword** (skill, tool, or outcome) that matters most so it survives a 6-second skim and top-down ATS parsing.

## Relevance and prioritization

- Most relevant, most impressive bullets first within each entry — recruiters skim the top.
- Cut or shorten bullets that don't support the target role. Space is the constraint; spend it on what moves the needle.
- Tailor per application: the resume is not write-once. Re-rank and re-word toward each specific posting.

## Honesty

Maximize impact, never fabricate. Sharpen framing, quantify what's real, choose strong verbs —
but every claim must be something the user actually did and can speak to in an interview.
