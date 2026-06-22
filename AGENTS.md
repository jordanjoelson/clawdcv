# Working on clawdcv with any agent

clawdcv is agent-agnostic. It's meant to be driven by a coding agent — Claude Code is the
default, but Codex, Cursor, Gemini CLI, or any other AGENTS.md-aware tool works the same way.

**The operating manual is `CLAUDE.md`, plus `philosophy.md`.** Despite the name (it's just the
file Claude Code loads automatically), the instructions inside are model-agnostic: the edit →
render → `geometry.json` workflow, the ≥95% bullet-fill rules, the layout/page constraints, and
how to shape sections to the user's content. **If you are not Claude Code, read `CLAUDE.md` and
`philosophy.md` now, before editing anything** — that's where the real workflow lives. (Claude
Code already pulls both in for you.)

**The one gotcha worth knowing up front:** after you edit `resume.yaml`, the browser only
re-renders and refreshes `geometry.json` while the `localhost:3000` window is **visible** on
screen (it does NOT need focus — an unfocused window on a second monitor is fine; only a
minimized or fully-covered window stops it). If `geometry.json` still shows old text, tell the
user to make that window visible, don't assume your edit failed. Full detail is in `CLAUDE.md`.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
