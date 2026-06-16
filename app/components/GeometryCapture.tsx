'use client'
import { useLayoutEffect } from 'react'
import { prepareWithSegments, measureLineStats } from '@chenglou/pretext'
import type { Resume } from '../types'

const FONT = '14.67px Calibri'

export default function GeometryCapture({ data }: { data: Resume }) {
  useLayoutEffect(() => {
    const allBulletLists = document.querySelectorAll('[data-bullets]')
    if (!allBulletLists.length) return

    const firstLi = allBulletLists[0].querySelector('li') as HTMLElement | null
    if (!firstLi) return

    const containerWidth = firstLi.offsetWidth
    const lineHeight = parseFloat(getComputedStyle(firstLi).lineHeight)

    const measure = (text: string) => {
      const prepared = prepareWithSegments(text, FONT)
      const { lineCount, maxLineWidth } = measureLineStats(prepared, containerWidth)
      return {
        lines: lineCount,
        width: Math.round(maxLineWidth * 10) / 10,
        fill: Math.round((maxLineWidth / containerWidth) * 1000) / 1000,
        remaining: Math.round((containerWidth - maxLineWidth) * 10) / 10,
      }
    }

    // Inject indicators directly into each <li> so they follow bullets naturally
    const injected: { el: HTMLElement; span: HTMLSpanElement; origPos: string }[] = []
    allBulletLists.forEach(ul => {
      ul.querySelectorAll('li').forEach(li => {
        const el = li as HTMLElement
        const m = measure(el.textContent ?? '')

        const origPos = el.style.position
        el.style.position = 'relative'

        const span = document.createElement('span')
        span.setAttribute('data-geo', '')
        // font-size 12px renders as 9px at 0.75 scale (matches the scaled resume)
        span.style.cssText = [
          'position: absolute',
          'left: 100%',
          'margin-left: 8px',
          'top: 0',
          'font-size: 12px',
          'font-family: monospace',
          'line-height: 1',
          'pointer-events: none',
          'user-select: none',
          'white-space: nowrap',
          `color: ${m.lines > 1 ? '#ef4444' : m.fill < 0.75 ? '#f59e0b' : '#22c55e'}`,
        ].join(';')
        span.textContent = `${Math.round(m.fill * 100)}%`
        el.appendChild(span)
        injected.push({ el, span, origPos })
      })
    })

    // Build geometry snapshot for Claude
    const experience = data.experience.map(entry => ({
      company: entry.company,
      bullets: entry.bullets.map((text, i) => ({ i, text, ...measure(text) })),
    }))

    const projects = data.projects.map(entry => ({
      name: entry.name,
      bullets: entry.bullets.map((text, i) => ({ i, text, ...measure(text) })),
    }))

    const pageEl = document.querySelector('[data-resume-page]') as HTMLElement | null
    const scrollHeight = pageEl?.scrollHeight ?? 0
    const capacity = Math.round(11 * 96)

    const warnings: string[] = []
    experience.forEach(e => e.bullets.forEach(b => {
      if (b.lines > 1) warnings.push(`experience "${e.company}" bullet[${b.i}]: ${b.lines} lines`)
      else if (b.fill < 0.75) warnings.push(`experience "${e.company}" bullet[${b.i}]: ${Math.round(b.fill * 100)}% fill — too short`)
    }))
    projects.forEach(e => e.bullets.forEach(b => {
      if (b.lines > 1) warnings.push(`project "${e.name}" bullet[${b.i}]: ${b.lines} lines`)
      else if (b.fill < 0.75) warnings.push(`project "${e.name}" bullet[${b.i}]: ${Math.round(b.fill * 100)}% fill — too short`)
    }))
    if (scrollHeight > capacity) warnings.push(`page overflows by ${scrollHeight - capacity}px`)

    fetch('/api/geometry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        font: FONT, containerWidth, lineHeight,
        page: { scrollHeight, capacity, remaining: capacity - scrollHeight },
        experience, projects, warnings,
      }, null, 2),
    })

    return () => {
      injected.forEach(({ el, span, origPos }) => {
        span.remove()
        el.style.position = origPos
      })
    }
  }, [data])

  return null
}
