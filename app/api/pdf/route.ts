import puppeteer from 'puppeteer'

export const dynamic = 'force-dynamic'

export async function GET() {
  let browser
  try {
    browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 1 })
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 10000 })

    // Strip shell and reset zoom
    await page.evaluate(() => {
      const main = document.querySelector('main') as HTMLElement | null
      if (main) main.style.cssText = 'background:white;padding:0;min-height:unset;display:block'
      const wrap = main?.firstElementChild as HTMLElement | null
      if (wrap) { wrap.style.transform = 'none'; wrap.style.marginBottom = '0' }
      document.querySelectorAll<HTMLElement>('[data-export-btn],[data-geo]').forEach(el => {
        el.style.display = 'none'
      })
    })

    await page.emulateMediaType('print')

    // Emit a STANDARD Letter sheet (8.5 × 11in / 612 × 792pt), not a page sized to the
    // content. A content-fit page (e.g. 8.5 × 10.9in) is non-standard, so viewers and
    // printers fit it to Letter and it reads as "zoomed out". The resume fits one page
    // (geometry keeps page.remaining ≥ 0), and in print the element's padding-bottom is
    // dropped, so content clears 11in with room to spare — no phantom second page.
    // margin:0 because the page element's own padding already supplies the 0.5in margins.
    const pdf = await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })

    // page.pdf() returns Uint8Array<ArrayBufferLike>, which the lib won't accept as a
    // BodyInit (it could in theory be SharedArrayBuffer-backed). Copy into a fresh
    // ArrayBuffer-backed Uint8Array, which is a valid response body.
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
      },
    })
  } catch (err) {
    console.error('[pdf]', err)
    return new Response(String(err), { status: 500 })
  } finally {
    await browser?.close()
  }
}
