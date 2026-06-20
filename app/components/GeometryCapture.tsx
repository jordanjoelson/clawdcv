'use client'
import { useLayoutEffect } from 'react'
import { prepareWithSegments, measureNaturalWidth } from '@chenglou/pretext'
import { prepareRichInline, walkRichInlineLineRanges, type RichInlineItem } from '@chenglou/pretext/rich-inline'
import type { Resume } from '../types'

// Wrap 1px before the true edge so calibration jitter can never flip a line. 1px (not 2)
// because the data showed the tightest safe line sits ~1.5px off the edge — a 2px margin
// would false-flag a line that genuinely fits. This is a fixed px safety margin, so it is
// font-independent and stays put when the font changes.
const WRAP_MARGIN = 1

const r1 = (n: number) => Math.round(n * 10) / 10
const r3 = (n: number) => Math.round(n * 1000) / 1000

// `layout` is a signal that changes when PageLayout's page slicing settles. Depending on
// it makes this pass re-run *after* the cards re-slice, so badge positions track the final
// layout instead of lagging a render behind on multi-page edits.
export default function GeometryCapture({ data, layout, boldKeywords = true }: { data: Resume; layout?: string; boldKeywords?: boolean }) {
  useLayoutEffect(() => {
    // The body runs async (we await font load), so cleanup can't be returned from it.
    // Track injected nodes out here and let the sync cleanup below tear them down.
    let cancelled = false
    const injectedSpans: HTMLSpanElement[] = []
    const touchedCards = new Map<HTMLElement, string>()

    const run = async () => {
      // Wait for the active font to actually load before measuring, so the probe, Pretext,
      // and the real bullets all agree on glyph widths. System fonts (Calibri) resolve
      // instantly; this only matters once a non-installed/web font is in play.
      if (document.fonts?.ready) { try { await document.fonts.ready } catch {} }
      if (cancelled) return

      const allBulletLists = document.querySelectorAll('[data-bullets]')
      if (!allBulletLists.length) return

      const firstLi = allBulletLists[0].querySelector('li') as HTMLElement | null
      if (!firstLi) return

      const containerWidth = firstLi.offsetWidth
      const cs = getComputedStyle(firstLi)
      const lineHeight = parseFloat(cs.lineHeight)

      // Derive the font from the DOM instead of hardcoding it. Pretext then measures
      // whatever the browser actually renders, so changing the CSS font-family/size is the
      // only edit needed — the measurement engine follows automatically. The shorthand
      // (style weight size family-list) is valid for both canvas measureText and CSS.
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      // **bold** keyword runs render at weight 700 (see ResumeContent.bulletNodes / .bold).
      // Bold glyphs are WIDER, so measuring them as normal weight under-counts width and
      // makes a near-full bullet wrap in the real DOM while geometry still says "1 line."
      // Measure each bold run with this font instead — that is the whole point of the
      // rich-inline path below.
      const boldFont = `${cs.fontStyle} 700 ${cs.fontSize} ${cs.fontFamily}`

      // Measure Pretext's canvas-vs-DOM width bias LIVE for the active font, rather than
      // hardcoding a constant tuned for one font. Pretext's measureText runs ~constant-
      // proportionally off from real rendering, but the factor differs per font. A hidden
      // no-wrap probe yields each bullet's true rendered width; the median of real/Pretext
      // over real content is the calibration. Uncorrected, a line Pretext calls "100% full"
      // can wrap in the real DOM (or vice-versa) once the font changes.
      const samples = [
        ...data.experience.flatMap(e => e.bullets),
        ...data.projects.flatMap(e => e.bullets),
      ]
      const probeEl = document.createElement('span')
      probeEl.style.cssText =
        'position:absolute;left:-9999px;top:-9999px;visibility:hidden;white-space:nowrap;margin:0;padding:0;border:0'
      probeEl.style.font = font
      document.body.appendChild(probeEl)
      const ratios: number[] = []
      for (const raw of samples) {
        const s = raw.replace(/\*\*/g, '')
        if (!s || s.length < 20) continue // skip short strings — too noisy to calibrate on
        probeEl.textContent = s
        const real = probeEl.getBoundingClientRect().width
        const pre = measureNaturalWidth(prepareWithSegments(s, font))
        if (real > 0 && pre > 0) ratios.push(real / pre)
      }
      probeEl.remove()
      ratios.sort((a, b) => a - b)
      // Median, not mean — robust to the odd bullet whose glyph mix skews the ratio.
      const CALIBRATION = ratios.length ? ratios[Math.floor(ratios.length / 2)] : 1
      const wrapWidth = containerWidth / CALIBRATION - WRAP_MARGIN

      // Split a bullet's raw text into rich-inline runs, sending **bold** spans through the
      // bold font. Mirrors ResumeContent.bulletNodes so measurement matches what renders.
      const toRuns = (raw: string): RichInlineItem[] => {
        if (!boldKeywords) return [{ text: raw.replace(/\*\*/g, ''), font }]
        return raw
          .split(/(\*\*[^*]+\*\*)/g)
          .filter(Boolean)
          .map(part => {
            const m = /^\*\*([^*]+)\*\*$/.exec(part)
            return m ? { text: m[1], font: boldFont } : { text: part, font }
          })
      }

      // Measure a bullet (bold-aware) against the bullet container width.
      const measure = (raw: string) => {
        const prepared = prepareRichInline(toRuns(raw))
        // `fill` measures the LAST line, not the widest. Middle lines always wrap near-full,
        // so the only line that can waste space is the final one.
        let lastLineWidth = 0
        const lineCount = walkRichInlineLineRanges(prepared, wrapWidth, line => { lastLineWidth = line.width })
        const trueWidth = lastLineWidth * CALIBRATION
        return {
          lines: lineCount,
          width: r1(trueWidth),
          fill: r3(trueWidth / containerWidth),
          remaining: r1(containerWidth - trueWidth),
        }
      }

      // Non-bullet lines (skills rows, education details, honors) get a fill % too, but they
      // are single full-width lines — not list items held to the bullet rules — so they are
      // measured straight off the real DOM. Reading the rendered line boxes via a Range is
      // inherently bold-correct and needs no calibration. Ratios cancel the 0.75 page zoom.
      const measureLineEl = (el: HTMLElement) => {
        const cw = el.offsetWidth
        const range = document.createRange()
        range.selectNodeContents(el)
        const rects = Array.from(range.getClientRects()).filter(rc => rc.width > 0)
        if (!rects.length) return { lines: 0, width: 0, fill: 0, remaining: r1(cw) }
        // Group rects into lines by their top edge; a line can have several rects (one per
        // formatting run), so the line's width spans from its leftmost to rightmost rect.
        const byTop = new Map<number, { l: number; r: number }>()
        for (const rc of rects) {
          const k = Math.round(rc.top)
          const g = byTop.get(k) ?? { l: Infinity, r: -Infinity }
          g.l = Math.min(g.l, rc.left)
          g.r = Math.max(g.r, rc.right)
          byTop.set(k, g)
        }
        const tops = [...byTop.keys()].sort((a, b) => a - b)
        const last = byTop.get(tops[tops.length - 1])!
        const scale = (el.getBoundingClientRect().width / cw) || 1 // undo page zoom
        const width = (last.r - last.l) / scale
        return { lines: tops.length, width: r1(width), fill: r3(width / cw), remaining: r1(cw - width) }
      }

      // ---- Snapshot for Claude (geometry.json) -------------------------------------------
      const experience = data.experience.map(entry => ({
        company: entry.company,
        bullets: entry.bullets.map((text, i) => ({ i, text, ...measure(text) })),
      }))
      const projects = data.projects.map(entry => ({
        name: entry.name,
        bullets: entry.bullets.map((text, i) => ({ i, text, ...measure(text) })),
      }))
      // Flatten in DOM order (experience bullets, then project bullets) so badges can reuse
      // these exact measurements by index instead of re-measuring the stripped DOM text.
      const flatBullets = [...experience.flatMap(e => e.bullets), ...projects.flatMap(e => e.bullets)]

      const probe = document.querySelector('[data-resume-page]') as HTMLElement | null
      const fillLines = probe
        ? Array.from(probe.querySelectorAll<HTMLElement>('[data-fill-line]')).map(el => ({
            section: el.getAttribute('data-fill-section') ?? '',
            label: el.getAttribute('data-fill-label') ?? '',
            ...measureLineEl(el),
          }))
        : []

      // ---- Dev fill badges in each page card's right margin ------------------------------
      // Children of the card so they sit OUTSIDE the slice clip (multi-page clipping would
      // otherwise cut them off). Placed at each line's vertical offset within the card.
      const TOP_PAD = 48
      document.querySelectorAll('[data-page]').forEach(cardNode => {
        const card = cardNode as HTMLElement
        const clip = card.querySelector('[data-page-clip]') as HTMLElement | null
        if (!clip) return
        const sliceH = clip.offsetHeight
        if (!touchedCards.has(card)) {
          touchedCards.set(card, card.style.position)
          card.style.position = 'relative'
        }
        const addBadge = (top: number, pct: number, color: string) => {
          const span = document.createElement('span')
          span.setAttribute('data-geo', '')
          // font-size 12px renders as 9px at 0.75 scale (matches the scaled resume)
          span.style.cssText = [
            'position: absolute', 'right: 6px', `top: ${top}px`,
            'font-size: 12px', 'font-family: monospace', 'line-height: 1',
            'pointer-events: none', 'user-select: none', 'white-space: nowrap',
            `color: ${color}`,
          ].join(';')
          span.textContent = `${Math.round(pct * 100)}%`
          card.appendChild(span)
          injectedSpans.push(span)
        }
        const visible = (top: number) => top >= TOP_PAD - 2 && top <= TOP_PAD + sliceH

        // Bullets: green ≥95%, amber below — reuse the snapshot measurements by DOM index.
        card.querySelectorAll('[data-bullets] li').forEach((li, idx) => {
          const el = li as HTMLElement
          if (!visible(el.offsetTop)) return
          const m = flatBullets[idx]
          if (!m) return
          addBadge(el.offsetTop, m.fill, m.fill < 0.95 ? '#f59e0b' : '#22c55e')
        })
        // Fill-lines (skills/education/honors): blue, informational — these aren't bullets
        // and aren't held to the 95% rule, so they get a neutral colour.
        card.querySelectorAll('[data-fill-line]').forEach(node => {
          const el = node as HTMLElement
          if (!visible(el.offsetTop)) return
          addBadge(el.offsetTop, measureLineEl(el).fill, '#3b82f6')
        })
      })

      // Report height against the PDF's page-1 capacity, so geometry.json agrees with both
      // the on-screen page count and the downloaded PDF. Print zeroes page 1's bottom padding
      // (globals.css @media print), so page-1 content may run to `pageHeight - padTop`.
      const pageEl = probe
      const pcs = pageEl ? getComputedStyle(pageEl) : null
      const padTop = pcs ? parseFloat(pcs.paddingTop) || 48 : 48
      const padBot = pcs ? parseFloat(pcs.paddingBottom) || 0 : 0
      const contentHeight = Math.round((pageEl?.scrollHeight ?? 0) - padTop - padBot)
      const capacity = Math.round(11 * 96) - padTop

      // A bullet may be any number of lines (on request) — what matters is that its LAST
      // line is full (≥95%), so no real estate is wasted. Page overflow is the other
      // failure: too many lines total to fit the sheet. Fill-lines are informational only.
      const warnings: string[] = []
      experience.forEach(e => e.bullets.forEach(b => {
        if (b.fill < 0.95) warnings.push(`experience "${e.company}" bullet[${b.i}]: last line ${Math.round(b.fill * 100)}% — looks short`)
      }))
      projects.forEach(e => e.bullets.forEach(b => {
        if (b.fill < 0.95) warnings.push(`project "${e.name}" bullet[${b.i}]: last line ${Math.round(b.fill * 100)}% — looks short`)
      }))
      if (contentHeight > capacity) warnings.push(`page overflows by ${contentHeight - capacity}px`)

      fetch('/api/geometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          font, calibration: Math.round(CALIBRATION * 100000) / 100000,
          containerWidth, lineHeight,
          page: { contentHeight, capacity, remaining: capacity - contentHeight },
          experience, projects, fillLines, warnings,
        }, null, 2),
      })
    }

    run()

    return () => {
      cancelled = true
      injectedSpans.forEach(s => s.remove())
      touchedCards.forEach((origPos, card) => { card.style.position = origPos })
    }
  }, [data, layout, boldKeywords])

  return null
}
