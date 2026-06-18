'use client'
import { useState, useEffect } from 'react'

// Dev-only view toggle for the fill % badges. Flips their visibility via a CSS hook
// (html[data-badges="off"]) — the badges are still injected and geometry is still
// measured underneath, so toggling them off doesn't affect the live geometry feedback.
export default function BadgeToggle() {
  const [show, setShow] = useState(true)

  // Restore saved preference on mount.
  useEffect(() => {
    const saved = localStorage.getItem('showBadges')
    if (saved !== null) setShow(saved === 'true')
  }, [])

  // Reflect + persist the choice.
  useEffect(() => {
    document.documentElement.dataset.badges = show ? 'on' : 'off'
    localStorage.setItem('showBadges', String(show))
  }, [show])

  return (
    <label
      data-app-control
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        background: '#1e293b',
        color: '#fff',
        borderRadius: '6px',
        fontSize: '13px',
        fontFamily: 'sans-serif',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        zIndex: 1000,
        userSelect: 'none',
      }}
    >
      <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} style={{ cursor: 'pointer' }} />
      Show %
    </label>
  )
}
