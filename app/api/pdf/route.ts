import puppeteer from 'puppeteer'
import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'

export const dynamic = 'force-dynamic'

// CSS px → PDF pt (PDF is 72dpi, the DOM is measured at 96dpi).
const px2pt = (px: number) => px * 0.75
// 0.5in standard margin in pt — matches the @page continuation top/side margins, so the
// stamped header sits in that margin band, directly above where the content starts.
const MARGIN = 36

// getComputedStyle color ("rgb(r, g, b)" / "rgba(...)") → pdf-lib rgb().
function cssColor(s: string) {
  const m = s.match(/\d+(\.\d+)?/g)
  if (!m || m.length < 3) return rgb(0, 0, 0)
  return rgb(+m[0] / 255, +m[1] / 255, +m[2] / 255)
}

// The slim continuation header (page 2+), read from the live on-screen RunningHeader so it
// tracks the active template's font/size/color, then drawn into each continuation page's top
// margin. Page 1 is never stamped, so its masthead-only layout is untouched.
type HeaderStyle = {
  name: string
  serif: boolean
  nameSize: number; nameColor: string
  pageSize: number; pageColor: string
  ruleColor: string; ruleWidth: number
}

async function stampHeaders(pdfBytes: Uint8Array, h: HeaderStyle): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes)
  const count = doc.getPageCount()
  if (count <= 1) return pdfBytes // single page: nothing to stamp

  const bold: PDFFont = await doc.embedFont(h.serif ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold)
  const reg: PDFFont = await doc.embedFont(h.serif ? StandardFonts.TimesRoman : StandardFonts.Helvetica)
  const nameSize = px2pt(h.nameSize)
  const pageSize = px2pt(h.pageSize)
  const nameColor = cssColor(h.nameColor)
  const pageColor = cssColor(h.pageColor)
  const ruleColor = cssColor(h.ruleColor)

  for (let i = 1; i < count; i++) {
    const pg = doc.getPage(i)
    const { width, height } = pg.getSize()
    // Header text sits MARGIN (0.5in) below the top edge — same top margin as page 1's
    // masthead — so the name ascends from there. The @page continuation top margin
    // (globals.css) is sized to clear the header + rule, so content starts below it.
    const baseline = height - MARGIN - nameSize
    pg.drawText(h.name, { x: MARGIN, y: baseline, size: nameSize, font: bold, color: nameColor })
    const label = `Page ${i + 1} of ${count}`
    const lw = reg.widthOfTextAtSize(label, pageSize)
    pg.drawText(label, { x: width - MARGIN - lw, y: baseline, size: pageSize, font: reg, color: pageColor })
    const ruleY = baseline - 6
    pg.drawLine({
      start: { x: MARGIN, y: ruleY }, end: { x: width - MARGIN, y: ruleY },
      thickness: px2pt(h.ruleWidth), color: ruleColor,
    })
  }
  return await doc.save()
}

// Concatenate several PDFs into one (used for the combined resume + cover letter export).
// Rendering each document on its own and merging — rather than printing one ?doc=both DOM —
// keeps the cover letter free of the resume's continuation header: only the resume render is
// stamped, the cover render is not, and the merge just appends the cover's page(s) after.
async function mergePdfs(parts: Uint8Array[]): Promise<Uint8Array> {
  const out = await PDFDocument.create()
  for (const bytes of parts) {
    const src = await PDFDocument.load(bytes)
    const pages = await out.copyPages(src, src.getPageIndices())
    pages.forEach(p => out.addPage(p))
  }
  return await out.save()
}

// Render one document (?doc=resume or ?doc=cover) to a PDF on the given browser. `stamp`
// controls the continuation running-header (resume only — the cover letter never gets it).
async function renderOne(browser: import('puppeteer').Browser, origin: string, doc: 'resume' | 'cover', stamp: boolean): Promise<Uint8Array> {
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 1 })
    // ?print=1 tells GeometryCapture to skip measuring (this render is transient and must not
    // overwrite the live editing view's geometry.json). `origin` is derived from the incoming
    // request (below), NOT hardcoded to :3000 — otherwise, when another dev server holds :3000
    // and Next starts this app on :3001, the export would render that other project's page.
    await page.goto(`${origin}?doc=${doc}&print=1`, { waitUntil: 'networkidle2', timeout: 10000 })

    // Strip shell + reset zoom, and read the running header's live style (so the stamped PDF
    // header matches whatever template is active — font family, sizes, colours, rule weight).
    const header = await page.evaluate((): HeaderStyle => {
      const main = document.querySelector('main') as HTMLElement | null
      if (main) main.style.cssText = 'background:white;padding:0;min-height:unset;display:block'
      const wrap = main?.firstElementChild as HTMLElement | null
      if (wrap) { wrap.style.transform = 'none'; wrap.style.marginBottom = '0' }
      document.querySelectorAll<HTMLElement>('[data-export-btn],[data-geo]').forEach(el => { el.style.display = 'none' })

      const name = document.querySelector('h1')?.textContent?.trim() ?? ''
      const rh = document.querySelector('[data-running-header]') as HTMLElement | null
      const spans = rh ? rh.querySelectorAll('span') : ([] as unknown as NodeListOf<HTMLElement>)
      const rhcs = rh ? getComputedStyle(rh) : null
      const ncs = spans[0] ? getComputedStyle(spans[0]) : null
      const pcs = spans[1] ? getComputedStyle(spans[1]) : null
      const ff = ncs?.fontFamily ?? ''
      // Serif if a known serif family is named, or the stack ends in generic `serif` — but
      // NOT `sans-serif` (which contains the substring "serif" and would false-positive).
      return {
        name,
        serif: /georgia|times|garamond|cambria/i.test(ff) || /(^|,)\s*serif\s*$/i.test(ff),
        nameSize: parseFloat(ncs?.fontSize ?? '15'),
        nameColor: ncs?.color ?? 'rgb(0,0,0)',
        pageSize: parseFloat(pcs?.fontSize ?? '12'),
        pageColor: pcs?.color ?? 'rgb(85,85,85)',
        ruleColor: rhcs?.borderBottomColor ?? 'rgb(0,0,0)',
        ruleWidth: parseFloat(rhcs?.borderBottomWidth ?? '1'),
      }
    })

    await page.emulateMediaType('print')

    // Emit a STANDARD Letter sheet (8.5 × 11in / 612 × 792pt). margin:0 here because the
    // margins come from CSS: the element's 0.5in pad-top plus the @page boxes. Content beyond
    // one page's budget paginates onto a second sheet; we stamp the running header onto those.
    const pdf = await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })

    // Stamp the continuation header onto pages 2+ (no-op for a single-page doc). This happens
    // AFTER rendering, so it can't disturb the page-1 layout or the pagination. The cover
    // letter is never stamped (stamp=false) — it's a standalone letter, not a resume page.
    return stamp ? await stampHeaders(pdf, header) : new Uint8Array(pdf)
  } finally {
    await page.close()
  }
}

export async function GET(request: Request) {
  // ?doc=resume (default) | cover | both. 'both' renders each document on its own and
  // concatenates them, so the cover letter page carries no resume continuation header.
  const reqUrl = new URL(request.url)
  const docParam = reqUrl.searchParams.get('doc')
  const doc: 'resume' | 'cover' | 'both' = docParam === 'cover' || docParam === 'both' ? docParam : 'resume'
  // Render against THIS server's own origin (e.g. http://localhost:3001 when :3000 is taken),
  // so the export always captures clawdcv itself, never whatever else holds the default port.
  const origin = reqUrl.origin

  let browser
  try {
    browser = await puppeteer.launch()
    let out: Uint8Array
    if (doc === 'both') {
      const resumePdf = await renderOne(browser, origin, 'resume', true)
      const coverPdf = await renderOne(browser, origin, 'cover', false)
      out = await mergePdfs([resumePdf, coverPdf])
    } else {
      out = await renderOne(browser, origin, doc, doc === 'resume')
    }

    // Copy into a fresh ArrayBuffer-backed Uint8Array (a valid BodyInit; the raw buffers can
    // in theory be SharedArrayBuffer-backed, which the Response type rejects).
    return new Response(new Uint8Array(out), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${doc}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[pdf]', err)
    return new Response(String(err), { status: 500 })
  } finally {
    await browser?.close()
  }
}
