'use client'
import { useState } from 'react'

export default function ExportButton() {
  const [busy, setBusy] = useState(false)

  // Generate the PDF server-side via the puppeteer /api/pdf route instead of window.print().
  // page.pdf() emits a real vector PDF with selectable, embedded text (ATS-parsable — not an
  // image) and exact, code-controlled margins, with NO browser headers/footers (the localhost
  // URL, date, "1 of 1" chrome window.print() stamps on). The download matches the preview.
  const save = async () => {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/pdf')
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'resume.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[export]', err)
      alert(`PDF export failed: ${err}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      data-export-btn
      onClick={save}
      disabled={busy}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '8px 16px',
        background: '#1e293b',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontFamily: 'sans-serif',
        cursor: busy ? 'wait' : 'pointer',
        opacity: busy ? 0.7 : 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        zIndex: 1000,
      }}
    >
      {busy ? 'Generating…' : 'Save PDF'}
    </button>
  )
}
