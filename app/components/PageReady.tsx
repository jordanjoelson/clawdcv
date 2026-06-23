'use client'
import { useEffect } from 'react'

// Marks the document ready once the client has mounted (and the real app/module CSS has
// loaded), revealing the resume. Until then the critical CSS in layout.tsx keeps the resume
// hidden over the charcoal background, so a reload never flashes raw, unstyled content on
// white. Always rendered (prod + dev) so the reveal class is reliably added.
export default function PageReady() {
  useEffect(() => {
    const root = document.documentElement
    const id = requestAnimationFrame(() => root.classList.add('cv-ready'))
    return () => cancelAnimationFrame(id)
  }, [])
  return null
}
