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

    // Measure the actual rendered content height in print mode
    const contentHeight = await page.evaluate(() => {
      return (document.querySelector('[data-resume-page]') as HTMLElement | null)?.scrollHeight ?? 1056
    })

    // Use exact content height so everything lands on one page — no clipping, no scale math
    const pdf = await page.pdf({
      width: '8.5in',
      height: `${contentHeight}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })

    return new Response(pdf, {
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
