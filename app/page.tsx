import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import type { Resume, Profile } from './types'
import ResumeView from './components/Resume'
import ExportButton from './components/ExportButton'
import BadgeToggle from './components/BadgeToggle'
import s from './components/resume.module.css'

export const dynamic = 'force-dynamic'

// Rendering prefs live in profile.yaml; fall back to sensible defaults if it's absent.
const DEFAULT_PROFILE: Profile = { template: 'jake', boldKeywords: true }

function loadProfile(): Profile {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'profile.yaml'), 'utf-8')
    return { ...DEFAULT_PROFILE, ...(yaml.load(raw) as Partial<Profile>) }
  } catch {
    return DEFAULT_PROFILE
  }
}

export default function Page() {
  const filePath = path.join(process.cwd(), 'resume.yaml')
  const raw = fs.readFileSync(filePath, 'utf-8')
  const data = yaml.load(raw) as Resume
  const profile = loadProfile()

  return (
    <main className={s.shell} data-shell data-template={profile.template}>
      <div data-zoom-wrap style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}>
        <ResumeView data={data} boldKeywords={profile.boldKeywords} />
      </div>
      {process.env.NODE_ENV === 'development' && <BadgeToggle />}
      <ExportButton name={data.name} />
    </main>
  )
}
