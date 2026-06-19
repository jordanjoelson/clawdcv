'use client'
import { useState, useLayoutEffect, useRef } from 'react'
import ResumeContent from './ResumeContent'
import GeometryCapture from './GeometryCapture'
import type { Resume } from '../types'
import s from './resume.module.css'

const PAGE_H = 1056   // 11in at 96dpi
const TOP_PAD = 48    // 0.5in
const BOT_PAD = 39    // calc(0.5in - 9px) — the page's bottom padding; reserved on page 1 too

// Per-page content budgets. Page 1 now reserves its bottom margin as well, so overflow
// breaks to page 2 instead of spilling into the bottom margin — and this matches the
// geometry overflow warning, which fires at this same point (scrollHeight > PAGE_H).
// Page 2+ mirror the print @page margins in globals.css.
//   page 1   — element pad-top (48) + pad-bottom (39)        → 1056 - 48 - 39 = 969
//   page 2+  — @page top (48) + @page bottom (48)            → 1056 - 48 - 48 = 960
const PAGE1_BUDGET = PAGE_H - TOP_PAD - BOT_PAD
const CONT_BUDGET = PAGE_H - TOP_PAD - TOP_PAD

export default function PageLayout({ data, boldKeywords = true }: { data: Resume; boldKeywords?: boolean }) {
  // breaks[i]..breaks[i+1] is the content slice shown on page i (content-relative px).
  const [breaks, setBreaks] = useState<number[]>([0, PAGE1_BUDGET])
  const probeRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const probe = probeRef.current
    if (!probe) return

    const compute = () => {
      // Read the page's actual padding from the DOM so the math is correct for whatever
      // template is active (e.g. the compact template uses a smaller top padding). This
      // also keeps page 1's budget aligned with the geometry overflow warning per-template.
      const cs = getComputedStyle(probe)
      const topPad = parseFloat(cs.paddingTop) || TOP_PAD
      const botPad = parseFloat(cs.paddingBottom) || BOT_PAD
      const total = probe.scrollHeight - topPad - botPad
      const page1Budget = PAGE_H - topPad - botPad

      // Clean break points (content-relative): before each section, and before each entry
      // except a section's first — keeping a heading bound to its first entry, mirroring
      // the print break rules (break-after on headings, break-inside on entries).
      const candidates = new Set<number>()
      probe.querySelectorAll('section').forEach(sec => {
        candidates.add((sec as HTMLElement).offsetTop - topPad)
        const entries = sec.querySelectorAll<HTMLElement>(`.${s.entry}`)
        entries.forEach((e, idx) => { if (idx > 0) candidates.add(e.offsetTop - topPad) })
      })
      const points = [...candidates].filter(o => o > 0 && o < total).sort((a, b) => a - b)

      // Greedily pack whole blocks into each page using that page's budget.
      const result = [0]
      let start = 0
      let page = 0
      while (start < total) {
        const limit = start + (page === 0 ? page1Budget : CONT_BUDGET)
        if (total <= limit) break
        const fit = points.filter(p => p > start && p <= limit)
        const next = fit.length ? fit[fit.length - 1] : limit // hard-cut if a block exceeds a page
        result.push(next)
        start = next
        page++
      }
      result.push(total)
      setBreaks(result)
    }

    compute()

    // Recompute when the probe's rendered size changes. Font/template/CSS edits change the
    // layout WITHOUT changing `data`, so a [data]-only effect would leave stale page breaks
    // — e.g. a phantom blank second page lingering after the content shrank back to one page.
    const ro = new ResizeObserver(() => compute())
    ro.observe(probe)
    return () => ro.disconnect()
  }, [data])

  const numPages = breaks.length - 1

  return (
    <>
      {/* Hidden probe: measures content + element offsets, carries data-resume-page for GeometryCapture */}
      <div
        ref={probeRef}
        data-resume-page
        className={s.page}
        style={{ position: 'absolute', left: '-9999px', top: 0, visibility: 'hidden', pointerEvents: 'none', minHeight: 0 }}
        aria-hidden="true"
      >
        <ResumeContent data={data} boldKeywords={boldKeywords} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {Array.from({ length: numPages }).map((_, i) => {
          const start = breaks[i]
          const sliceH = breaks[i + 1] - start
          return (
            <div key={i} data-page={i} className={s.page} style={{ minHeight: 'unset', height: `${PAGE_H}px`, overflow: 'hidden' }}>
              {/*
                Inner clip shows exactly this page's slice [start, start+sliceH]; its height
                is the slice height, so nothing from the next block peeks in (no shaved
                elements). overflow:hidden clips reliably inside the 0.75 zoom (clip-path
                with a negative inset does not). Single page needs no clip, so keep it
                visible there so the dev % badges in the right margin aren't cut.
                In print these collapse to one natural flow (see globals.css @media print).
              */}
              <div data-page-clip style={{ height: `${sliceH}px`, overflow: numPages > 1 ? 'hidden' : 'visible' }}>
                <div data-page-shift style={{ marginTop: `-${start}px` }}>
                  <ResumeContent data={data} bulletData boldKeywords={boldKeywords} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Measures geometry + draws the dev fill badges. Rendered here (not page.tsx) and
          keyed on the page breaks so it re-runs after slicing settles, keeping badges aligned. */}
      {process.env.NODE_ENV === 'development' && (
        <GeometryCapture data={data} layout={breaks.join(',')} />
      )}
    </>
  )
}
