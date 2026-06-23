'use client'
import { useState } from 'react'

// Recruiter-friendly filename conventions (derived from the resume name):
//   1 (default)     FirstName_LastName_Resume.pdf            — clean, easy to find
//   2 (per company) FirstName_LastName_Company_Resume.pdf    — for targeted / higher-volume applying
//   3 (per version) FirstName_LastName_SWE_Resume.pdf        — one file per role focus (SWE / AI_ML / Research)
type Doc = 'resume' | 'cover' | 'both'

export default function ExportButton({ name, hasCover = false }: { name: string; hasCover?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [company, setCompany] = useState('')
  const [version, setVersion] = useState('')

  // FirstName_LastName from the resume name (first + last token), filename-safe.
  const tokens = name.trim().split(/\s+/).filter(Boolean)
  const base = (tokens.length > 1 ? `${tokens[0]}_${tokens[tokens.length - 1]}` : tokens[0] || 'Resume')
    .replace(/[^A-Za-z0-9_]/g, '')
  const clean = (s: string) => s.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '')
  // Filename label follows the document being exported.
  const docLabel: Record<Doc, string> = {
    resume: 'Resume', cover: 'Cover_Letter', both: 'Resume_and_Cover_Letter',
  }
  const fileName = (suffix = '', doc: Doc = 'resume') =>
    `${base}${suffix ? '_' + clean(suffix) : ''}_${docLabel[doc]}.pdf`

  // Generate the PDF server-side via the puppeteer /api/pdf route. page.pdf() emits a real
  // vector PDF with selectable, embedded text (ATS-parsable — not an image) and exact margins,
  // with no browser header/footer chrome. The download matches the preview. `doc` selects the
  // resume, the cover letter, or both merged into one file.
  const download = async (suffix = '', doc: Doc = 'resume') => {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/pdf?doc=${doc}`)
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName(suffix, doc)
      a.click()
      URL.revokeObjectURL(url)
      setOpen(false)
    } catch (err) {
      console.error('[export]', err)
      alert(`PDF export failed: ${err}`)
    } finally {
      setBusy(false)
    }
  }

  const wrap: React.CSSProperties = { position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, fontFamily: 'sans-serif' }
  const seg: React.CSSProperties = {
    background: '#1e293b', color: '#fff', border: 'none', fontSize: '13px',
    cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1, padding: '8px 14px',
  }
  const panelInput: React.CSSProperties = {
    flex: 1, minWidth: 0, padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1',
    borderRadius: '4px', fontFamily: 'sans-serif',
  }
  const smallBtn: React.CSSProperties = {
    background: '#1e293b', color: '#fff', border: 'none', borderRadius: '4px',
    padding: '6px 10px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
  }
  const chip: React.CSSProperties = {
    background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '4px',
    padding: '5px 8px', fontSize: '11px', cursor: 'pointer',
  }

  return (
    <div style={wrap} data-export-btn>
      {open && (
        <div
          style={{
            position: 'absolute', bottom: '46px', right: 0, width: '300px',
            background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.18)', padding: '12px', display: 'flex',
            flexDirection: 'column', gap: '12px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Default: <code style={{ color: '#1e293b' }}>{fileName()}</code>
          </div>

          {/* Document picker — only when a cover letter exists. Each button downloads
              immediately: resume only, cover letter only, or both merged into one PDF. */}
          {hasCover && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Document</span>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <button style={chip} disabled={busy} onClick={() => download('', 'resume')}>Resume</button>
                <button style={chip} disabled={busy} onClick={() => download('', 'cover')}>Cover letter</button>
                <button style={chip} disabled={busy} onClick={() => download('', 'both')}>Resume + Cover letter</button>
              </div>
            </div>
          )}

          {/* Option 2 — target a company */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>2 · Target a company</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                style={panelInput}
                placeholder="Company (e.g. Google)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && company.trim()) download(company) }}
              />
              <button style={{ ...smallBtn, opacity: company.trim() ? 1 : 0.5 }} disabled={!company.trim() || busy} onClick={() => download(company)}>Save</button>
            </div>
          </div>

          {/* Option 3 — version label */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>3 · Version label</span>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {['SWE', 'AI_ML', 'Research'].map((v) => (
                <button key={v} style={chip} disabled={busy} onClick={() => download(v)}>{v}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                style={panelInput}
                placeholder="Custom label"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && version.trim()) download(version) }}
              />
              <button style={{ ...smallBtn, opacity: version.trim() ? 1 : 0.5 }} disabled={!version.trim() || busy} onClick={() => download(version)}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Split button: main = default (option 1), caret = options panel */}
      <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
        <button style={{ ...seg, borderRight: '1px solid rgba(255,255,255,0.18)' }} onClick={() => download()} disabled={busy}>
          {busy ? 'Generating…' : 'Save PDF'}
        </button>
        <button style={{ ...seg, padding: '8px 10px' }} onClick={() => setOpen((o) => !o)} disabled={busy} title="Naming options" aria-label="Naming options">
          {open ? '▴' : '▾'}
        </button>
      </div>
    </div>
  )
}
