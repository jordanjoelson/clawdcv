import type { CoverLetter, TemplateName } from '../types'
import s from './resume.module.css'

// Render a paragraph string, parsing **bold** markers into <strong> (same convention as
// resume bullets). When bold is off, the markers are stripped so the text renders plain.
function richText(text: string, bold: boolean): React.ReactNode {
  // Coerce defensively: a body paragraph containing ": " can be mis-parsed by YAML into a
  // map instead of a string, which would otherwise crash .split here. Quote such paragraphs
  // in coverletter.yaml; this guard keeps a slip from white-screening the whole page.
  const t = String(text)
  if (!bold) return t.replace(/\*\*/g, '')
  return t.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(part)
    return m ? <strong key={i}>{m[1]}</strong> : part
  })
}

// The cover letter as its own page card, styled from the active template's --vars (same
// .page tokens as the resume) so a combined PDF reads as one cohesive document. A formal
// address-block layout: sender → date → recipient → greeting → body → closing → signature.
// `data-cover-page` marks the card for GeometryCapture; `data-cover-content` wraps just the
// content so its natural height can be measured against the page budget.
export default function CoverLetterContent({
  data, resumeName, boldKeywords = true, template = 'jake',
}: { data: CoverLetter; resumeName: string; boldKeywords?: boolean; template?: TemplateName }) {
  const senderName = data.sender?.name ?? resumeName
  const signature = data.signature ?? data.sender?.name ?? resumeName
  const greeting = data.greeting ?? 'Dear Hiring Manager,'
  const closing = data.closing ?? 'Sincerely,'
  const r = data.recipient
  const recipientLines = [
    r?.name, r?.title, r?.company, ...(r?.lines ?? []),
  ].filter((l): l is string => Boolean(l && l.trim()))

  return (
    <div data-cover-page className={s.page} data-doc="cover" style={{ overflow: 'visible' }}>
      <div data-cover-content className={s.cover}>
        {/* Sender block */}
        <div className={s.coverSender}>
          <div className={s.bold}>{senderName}</div>
          {(data.sender?.lines ?? []).map((l, i) => <div key={i}>{l}</div>)}
        </div>

        {data.date && <p className={s.coverDate}>{data.date}</p>}

        {recipientLines.length > 0 && (
          <div className={s.coverRecipient}>
            {recipientLines.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}

        <p className={s.coverGreeting}>{greeting}</p>

        {data.body.map((para, i) => (
          <p key={i} className={s.coverPara}>{richText(para, boldKeywords)}</p>
        ))}

        <div className={s.coverClosing}>
          <p>{closing}</p>
          <p className={s.coverSignature}>{signature}</p>
        </div>
      </div>
    </div>
  )
}
