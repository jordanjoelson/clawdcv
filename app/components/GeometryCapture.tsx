'use client'
import { useLayoutEffect } from 'react'
import { prepareWithSegments, walkLineRanges, measureNaturalWidth } from '@chenglou/pretext'
import type { Resume } from '../types'

// Wrap 1px before the true edge so calibration jitter can never flip a line. 1px (not 2)
// because the data showed the tightest safe line sits ~1.5px off the edge — a 2px margin
// would false-flag a line that genuinely fits. This is a fixed px safety margin, so it is
// font-independent and stays put when the font changes.
const WRAP_MARGIN = 1

// `layout` is a signal that changes when PageLayout's page slicing settles. Depending on
// it makes this pass re-run *after* the cards re-slice, so badge positions track the final
// layout instead of lagging a render behind on multi-page edits.
export default function GeometryCapture({ data, layout }: { data: Resume; layout?: string }) {
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
      const probe = document.createElement('span')
      probe.style.cssText =
        'position:absolute;left:-9999px;top:-9999px;visibility:hidden;white-space:nowrap;margin:0;padding:0;border:0'
      probe.style.font = font
      document.body.appendChild(probe)
      const ratios: number[] = []
      for (const s of samples) {
        if (!s || s.length < 20) continue // skip short strings — too noisy to calibrate on
        probe.textContent = s
        const real = probe.getBoundingClientRect().width
        const pre = measureNaturalWidth(prepareWithSegments(s, font))
        if (real > 0 && pre > 0) ratios.push(real / pre)
      }
      probe.remove()
      ratios.sort((a, b) => a - b)
      // Median, not mean — robust to the odd bullet whose glyph mix skews the ratio.
      const CALIBRATION = ratios.length ? ratios[Math.floor(ratios.length / 2)] : 1

      const measure = (text: string) => {
        const prepared = prepareWithSegments(text, font)
        // Wrap where the real browser wraps: it overflows when the true width exceeds
        // the container, i.e. when Pretext's width exceeds containerWidth / CALIBRATION.
        // Shrinking the wrap width (plus a 1px margin) makes lineCount match the page.
        const wrapWidth = containerWidth / CALIBRATION - WRAP_MARGIN
        // `fill` measures the LAST line, not the widest. Middle lines always wrap near-
        // full, so the only line that can waste space is the final one — and a full last
        // line is the goal whether the bullet is 1 line or several. For a 1-line bullet
        // the last line is the whole line, so this is identical to before.
        let lastLineWidth = 0
        const lineCount = walkLineRanges(prepared, wrapWidth, line => { lastLineWidth = line.width })
        const trueWidth = lastLineWidth * CALIBRATION
        return {
          lines: lineCount,
          width: Math.round(trueWidth * 10) / 10,
          fill: Math.round((trueWidth / containerWidth) * 1000) / 1000,
          remaining: Math.round((containerWidth - trueWidth) * 10) / 10,
        }
      }

      // Render fill badges in each page card's right margin, as children of the card so
      // they sit OUTSIDE the slice clip — otherwise multi-page clipping cuts them off. Each
      // badge is placed at its bullet's vertical offset within the card, so a bullet's badge
      // appears on whichever page that bullet is visible. (display:none in print via [data-geo].)
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
        card.querySelectorAll('[data-bullets] li').forEach(li => {
          const el = li as HTMLElement
          const top = el.offsetTop // relative to the card (now positioned); reflects the slice shift
          if (top < TOP_PAD - 2 || top > TOP_PAD + sliceH) return // not visible on this page
          const m = measure(el.textContent ?? '')
          const span = document.createElement('span')
          span.setAttribute('data-geo', '')
          // font-size 12px renders as 9px at 0.75 scale (matches the scaled resume)
          span.style.cssText = [
            'position: absolute',
            'right: 6px',
            `top: ${top}px`,
            'font-size: 12px',
            'font-family: monospace',
            'line-height: 1',
            'pointer-events: none',
            'user-select: none',
            'white-space: nowrap',
            `color: ${m.fill < 0.95 ? '#f59e0b' : '#22c55e'}`,
          ].join(';')
          span.textContent = `${Math.round(m.fill * 100)}%`
          card.appendChild(span)
          injectedSpans.push(span)
        })
      })

      // Build geometry snapshot for Claude. Strip **bold** markers before measuring so the
      // asterisks don't count toward width (the snapshot keeps the raw text so markers stay
      // visible). Bold runs render a hair wider than measured here — negligible at these sizes.
      const plain = (t: string) => t.replace(/\*\*/g, '')
      const experience = data.experience.map(entry => ({
        company: entry.company,
        bullets: entry.bullets.map((text, i) => ({ i, text, ...measure(plain(text)) })),
      }))

      const projects = data.projects.map(entry => ({
        name: entry.name,
        bullets: entry.bullets.map((text, i) => ({ i, text, ...measure(plain(text)) })),
      }))

      const pageEl = document.querySelector('[data-resume-page]') as HTMLElement | null
      const scrollHeight = pageEl?.scrollHeight ?? 0
      const capacity = Math.round(11 * 96)

      // A bullet may be any number of lines (on request) — what matters is that its
      // LAST line is full (≥95%), so no real estate is wasted. `fill` is the last-line
      // fill, so this one rule covers 1-line and multi-line bullets alike. Page overflow
      // is the only other failure: too many lines total to fit the sheet.
      const warnings: string[] = []
      experience.forEach(e => e.bullets.forEach(b => {
        if (b.fill < 0.95) warnings.push(`experience "${e.company}" bullet[${b.i}]: last line ${Math.round(b.fill * 100)}% — looks short`)
      }))
      projects.forEach(e => e.bullets.forEach(b => {
        if (b.fill < 0.95) warnings.push(`project "${e.name}" bullet[${b.i}]: last line ${Math.round(b.fill * 100)}% — looks short`)
      }))
      if (scrollHeight > capacity) warnings.push(`page overflows by ${scrollHeight - capacity}px`)

      fetch('/api/geometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          font, calibration: Math.round(CALIBRATION * 100000) / 100000,
          containerWidth, lineHeight,
          page: { scrollHeight, capacity, remaining: capacity - scrollHeight },
          experience, projects, warnings,
        }, null, 2),
      })
    }

    run()

    return () => {
      cancelled = true
      injectedSpans.forEach(s => s.remove())
      touchedCards.forEach((origPos, card) => { card.style.position = origPos })
    }
  }, [data, layout])

  return null
}
