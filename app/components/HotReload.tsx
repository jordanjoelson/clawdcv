'use client'
import { useEffect } from 'react'

export default function HotReload() {
  useEffect(() => {
    // Reload on change if the tab is visible; otherwise defer the reload until
    // the tab is visible again (browsers freeze a hidden/minimized tab, so we
    // can't reload it in place — but we can the instant it comes back).
    let pending = false

    const reloadNow = () => window.location.reload()

    const es = new EventSource('/api/watch')
    es.onmessage = () => {
      if (document.visibilityState === 'visible') reloadNow()
      else pending = true
    }

    const onVisible = () => {
      if (pending && document.visibilityState === 'visible') reloadNow()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      es.close()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return null
}
