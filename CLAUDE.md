@AGENTS.md
@philosophy.md

# Resume Editor

This is a local-first resume tool. The user talks to you to edit their resume. You edit `resume.yaml`, the browser renders it live as Jake's Resume template, and `geometry.json` tells you the layout state after each render.

## Workflow

1. Read `geometry.json` before making any edits — it contains the current layout state measured by Pretext in the browser
2. Read `resume.yaml` to understand current content
3. Make edits to `resume.yaml`
4. The browser hot-reloads automatically on save
5. `geometry.json` updates after each reload — check it to verify your edits landed correctly

## Layout constraints

- **Font:** 14.67px Calibri (11pt) in a 720px wide content area
- **Bullet target:** 1 line per bullet. Pretext measures exact line counts — trust `geometry.json`, not your intuition about character counts
- **Page:** 8.5" × 11" (1056px at 96dpi). `geometry.json` reports `page.remaining` — keep it positive
- **Line height:** ~18.33px (reported live in `geometry.json` under `lineHeight`)

## geometry.json structure

```json
{
  "font": "14.67px Calibri",
  "containerWidth": 720,
  "lineHeight": 18.33,
  "page": {
    "scrollHeight": 1056,
    "capacity": 1056,
    "remaining": 0
  },
  "experience": [
    {
      "company": "Company Name",
      "bullets": [
        { "i": 0, "text": "...", "lines": 1 }
      ]
    }
  ],
  "projects": [...],
  "warnings": []
}
```

`warnings` is pre-computed — any bullet over 1 line or page overflow will appear there. Check it first.

## What to avoid

- Do not change font, font size, or container width in the CSS without updating the `FONT` constant in `app/components/GeometryCapture.tsx` to match — Pretext measurements will drift otherwise
- Do not add new sections or structural changes to the YAML without updating `app/types.ts` and `app/components/Resume.tsx`
- Do not edit `geometry.json` directly — it is generated on every page load
