'use client'
import { useLayoutEffect } from 'react'
import { prepareWithSegments, walkLineRanges } from '@chenglou/pretext'
import type { Resume } from '../types'

const FONT = '14.67px Calibri'

// Pretext's canvas measureText reports text ~0.25% narrower than the browser
// actually renders it — a constant proportional bias (verified by auditing real
// rendered widths across all bullets: error was a uniform ~0.25%, never random).
// Left uncorrected, Pretext calls a line "1 line / 100% full" that the real DOM
// then wraps, silently overflowing the page. Multiply measured widths by this so
// every number reflects what the browser draws. Re-measure if FONT/width changes.
const CALIBRATION = 1.0025
// Wrap 1px before the true edge so calibration jitter can never flip a line.
// 1px (not 2) because the data showed the tightest safe line sits ~1.5px off the
// edge — a 2px margin would false-flag a line that genuinely fits.
const WRAP_MARGIN = 1

// `layout` is a signal that changes when PageLayout's page slicing settles. Depending on
// it makes this pass re-run *after* the cards re-slice, so badge positions track the final
// layout instead of lagging a render behind on multi-page edits.
export default function GeometryCapture({ data, layout }: { data: Resume; layout?: string }) {
  useLayoutEffect(() => {
    const allBulletLists = document.querySelectorAll('[data-bullets]')
    if (!allBulletLists.length) return

    const firstLi = allBulletLists[0].querySelector('li') as HTMLElement | null
    if (!firstLi) return

    const containerWidth = firstLi.offsetWidth
    const lineHeight = parseFloat(getComputedStyle(firstLi).lineHeight)

    const measure = (text: string) => {
      const prepared = prepareWithSegments(text, FONT)
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
    const injectedSpans: HTMLSpanElement[] = []
    const touchedCards = new Map<HTMLElement, string>()
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

    // Build geometry snapshot for Claude
    const experience = data.experience.map(entry => ({
      company: entry.company,
      bullets: entry.bullets.map((text, i) => ({ i, text, ...measure(text) })),
    }))

    const projects = data.projects.map(entry => ({
      name: entry.name,
      bullets: entry.bullets.map((text, i) => ({ i, text, ...measure(text) })),
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
        font: FONT, containerWidth, lineHeight,
        page: { scrollHeight, capacity, remaining: capacity - scrollHeight },
        experience, projects, warnings,
      }, null, 2),
    })

    return () => {
      injectedSpans.forEach(s => s.remove())
      touchedCards.forEach((origPos, card) => { card.style.position = origPos })
    }
  }, [data, layout])

  return null
}
