'use client'
import { useState, useLayoutEffect, useRef } from 'react'
import ResumeContent from './ResumeContent'
import type { Resume } from '../types'
import s from './resume.module.css'

const PAGE_H = 1056   // 11in at 96dpi
const TOP_PAD = 48    // 0.5in
const BOT_PAD = 39    // calc(0.5in - 9px)
const CONTENT_H = PAGE_H - TOP_PAD - BOT_PAD  // 969px of usable content per page

export default function PageLayout({ data }: { data: Resume }) {
  const [numPages, setNumPages] = useState(1)
  const probeRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!probeRef.current) return
    // Subtract padding so we measure raw content height
    const contentH = probeRef.current.scrollHeight - TOP_PAD - BOT_PAD
    setNumPages(Math.max(1, Math.ceil(contentH / CONTENT_H)))
  }, [data])

  return (
    <>
      {/* Hidden probe: measures raw content height, carries data-resume-page for GeometryCapture */}
      <div
        ref={probeRef}
        data-resume-page
        className={s.page}
        style={{ position: 'absolute', left: '-9999px', top: 0, visibility: 'hidden', pointerEvents: 'none', minHeight: 0 }}
        aria-hidden="true"
      >
        <ResumeContent data={data} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {Array.from({ length: numPages }).map((_, i) => (
          <div key={i} className={s.page} style={{ minHeight: 'unset', height: `${PAGE_H}px` }}>
            {/*
              Inner clip sits inside the top padding — overflow:hidden here clips at the
              content edge, so the 48px top pad above it is always genuine white space.
            */}
            <div style={{ height: `${CONTENT_H}px`, overflow: 'hidden' }}>
              <div style={{ marginTop: `-${i * CONTENT_H}px` }}>
                <ResumeContent data={data} bulletData={i === 0} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
