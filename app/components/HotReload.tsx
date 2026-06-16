'use client'
import { useEffect } from 'react'

export default function HotReload() {
  useEffect(() => {
    const es = new EventSource('/api/watch')
    es.onmessage = () => window.location.reload()
    return () => es.close()
  }, [])

  return null
}
