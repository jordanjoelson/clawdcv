'use client'
import { useState, useLayoutEffect, useRef } from 'react'
import ResumeContent, { RunningHeader } from './ResumeContent'
import GeometryCapture from './GeometryCapture'
import type { Resume, TemplateName } from '../types'
import s from './resume.module.css'

const PAGE_H = 1056   // 11in at 96dpi
const TOP_PAD = 48    // 0.5in
const BOT_PAD = 48    // 0.5in

// Per-page content budgets — these must match what the DOWNLOADED PDF does, so the
// on-screen page count equals the printed page count (what the user actually submits).
// EVERY page reserves a standard 0.5in margin on BOTH top and bottom, so page 1 reads
// like a real resume instead of running to the sheet's bottom edge. Page 1's bottom
// margin is reserved by @page :first (globals.css) in print, so print breaks to page 2
// at the same point the on-screen preview does — keeping screen pages == PDF pages.
// Continuation pages (2+) additionally give up the running-header height — measured live
// in compute() (see contBudget), not a constant, so it tracks each template's font/spacing.
//   page 1   — top 48 + bottom 48                 → 1056 - 48 - 48        = 960
//   page 2+  — top 48 + bottom 48 + running header → 1056 - 48 - 48 - hdr  < 960
const PAGE1_BUDGET = PAGE_H - TOP_PAD - BOT_PAD

export default function PageLayout({ data, boldKeywords = true, template = 'jake' }: { data: Resume; boldKeywords?: boolean; template?: TemplateName }) {
  // breaks[i]..breaks[i+1] is the content slice shown on page i (content-relative px).
  const [breaks, setBreaks] = useState<number[]>([0, PAGE1_BUDGET])
  const probeRef = useRef<HTMLDivElement>(null)
  const headerProbeRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const probe = probeRef.current
    if (!probe) return

    const compute = () => {
      // Read the page's actual padding from the DOM so the math is correct for whatever
      // template is active (e.g. the compact template uses a smaller top padding). This
      // also keeps page 1's budget aligned with the geometry overflow warning per-template.
      const cs = getComputedStyle(probe)
      const topPad = parseFloat(cs.paddingTop) || TOP_PAD
      const botPad = parseFloat(cs.paddingBottom) || 0
      const total = probe.scrollHeight - topPad - botPad
      // Page 1 reserves a standard 0.5in margin top AND bottom (same as continuation
      // pages), so its budget is the sheet minus both pads — matching the PDF, where
      // @page :first reserves the bottom margin (see constants above).
      const page1Budget = PAGE_H - topPad - botPad
      // Continuation pages (2+) additionally give up the running header's height (measured
      // live from a hidden probe, incl. its bottom margin — so it adapts to each template's
      // font/spacing rather than a hardcoded constant). Only used once content spills past
      // page 1, so single-page resumes are unaffected.
      const hEl = headerProbeRef.current?.querySelector('[data-running-header]') as HTMLElement | null
      const headerH = hEl ? hEl.offsetHeight + (parseFloat(getComputedStyle(hEl).marginBottom) || 0) : 0
      const contBudget = PAGE_H - topPad - botPad - headerH

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
        const limit = start + (page === 0 ? page1Budget : contBudget)
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
        <ResumeContent data={data} boldKeywords={boldKeywords} template={template} />
      </div>

      {/* Hidden probe: measures the running header's height for the continuation-page budget,
          styled by .page so it inherits the active template's --vars (font, spacing, border). */}
      <div
        ref={headerProbeRef}
        className={s.page}
        style={{ position: 'absolute', left: '-9999px', top: 0, visibility: 'hidden', pointerEvents: 'none', minHeight: 0, height: 'auto' }}
        aria-hidden="true"
      >
        <RunningHeader name={data.name} page={2} total={2} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {Array.from({ length: numPages }).map((_, i) => {
          const start = breaks[i]
          const sliceH = breaks[i + 1] - start
          return (
            <div key={i} data-page={i} className={s.page} style={{ minHeight: 'unset', height: `${PAGE_H}px`, overflow: 'hidden' }}>
              {/* Page 2+ get the slim running header (name + "Page X of Y" + rule); page 1
                  keeps its full masthead from ResumeContent. Its height is reserved in the
                  continuation budget (contBudget) so the clipped slice below still fits. */}
              {i > 0 && <RunningHeader name={data.name} page={i + 1} total={numPages} />}
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
                  {/* PDF page-2+ headers are stamped onto the rendered PDF by /api/pdf
                      (pdf-lib); the on-screen page-2+ headers come from the cards above. So no
                      break plan is injected into the content flow. */}
                  <ResumeContent data={data} bulletData boldKeywords={boldKeywords} template={template} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Measures geometry + draws the dev fill badges. Rendered here (not page.tsx) and
          keyed on the page breaks so it re-runs after slicing settles, keeping badges aligned. */}
      {process.env.NODE_ENV === 'development' && (
        <GeometryCapture data={data} layout={breaks.join(',')} boldKeywords={boldKeywords} />
      )}
    </>
  )
}
