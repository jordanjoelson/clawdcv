'use client'
import { useEffect } from 'react'

export default function ExportButton() {
  useEffect(() => {
    const getWrap = () => document.querySelector<HTMLElement>('[data-zoom-wrap]')
    const getShell = () => document.querySelector<HTMLElement>('[data-shell]')

    const before = () => {
      const shell = getShell()
      if (shell) {
        shell.dataset.savedCss = shell.style.cssText
        shell.style.cssText = 'background:white;padding:0;min-height:0;display:block'
      }
      const wrap = getWrap()
      if (wrap) {
        wrap.dataset.savedTransform = wrap.style.transform
        wrap.dataset.savedMargin = wrap.style.marginBottom
        wrap.style.transform = 'none'
        wrap.style.marginBottom = '0'
      }
      // Remove min-height from the page element so Chrome paginates based on
      // actual content height — no blank pages, genuine overflow goes to page 2
      const resumePage = document.querySelector<HTMLElement>('[data-resume-page]')
      if (resumePage) {
        resumePage.dataset.savedMinHeight = resumePage.style.minHeight
        resumePage.style.minHeight = '0'
      }
    }

    const after = () => {
      const shell = getShell()
      if (shell) shell.style.cssText = shell.dataset.savedCss ?? ''
      const wrap = getWrap()
      if (wrap) {
        wrap.style.transform = wrap.dataset.savedTransform ?? ''
        wrap.style.marginBottom = wrap.dataset.savedMargin ?? ''
      }
      const resumePage = document.querySelector<HTMLElement>('[data-resume-page]')
      if (resumePage) resumePage.style.minHeight = resumePage.dataset.savedMinHeight ?? ''
    }

    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  }, [])

  return (
    <button
      data-export-btn
      onClick={() => window.print()}
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
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        zIndex: 1000,
      }}
    >
      Save PDF
    </button>
  )
}
