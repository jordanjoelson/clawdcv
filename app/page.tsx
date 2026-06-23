import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import type { Resume, Profile, CoverLetter } from './types'
import ResumeView from './components/Resume'
import CoverLetterContent from './components/CoverLetterContent'
import ExportButton from './components/ExportButton'
import BadgeToggle from './components/BadgeToggle'
import s from './components/resume.module.css'

export const dynamic = 'force-dynamic'

// Rendering prefs live in profile.yaml; fall back to sensible defaults if it's absent.
const DEFAULT_PROFILE: Profile = { template: 'jake', boldKeywords: true, pages: 'single' }

function loadProfile(): Profile {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'profile.yaml'), 'utf-8')
    return { ...DEFAULT_PROFILE, ...(yaml.load(raw) as Partial<Profile>) }
  } catch {
    return DEFAULT_PROFILE
  }
}

// The cover letter is optional — coverletter.yaml may not exist yet. Treat an empty/bodyless
// file as "no cover letter" so the feature stays invisible until there's real content.
function loadCoverLetter(): CoverLetter | null {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'coverletter.yaml'), 'utf-8')
    const cl = yaml.load(raw) as CoverLetter | null
    if (!cl || !Array.isArray(cl.body) || cl.body.length === 0) return null
    return cl
  } catch {
    return null
  }
}

// `?doc=` selects which document(s) to render. 'both' (the default on-screen view) stacks the
// resume and the cover letter so you can edit both live; the PDF route requests 'resume' or
// 'cover' to render exactly one document into its own PDF (combined = render each, then merge).
export default async function Page({ searchParams }: { searchParams: Promise<{ doc?: string }> }) {
  const { doc } = await searchParams
  const mode = doc === 'resume' || doc === 'cover' ? doc : 'both'

  const data = yaml.load(fs.readFileSync(path.join(process.cwd(), 'resume.yaml'), 'utf-8')) as Resume
  const profile = loadProfile()
  const cover = loadCoverLetter()

  const showResume = mode !== 'cover'
  const showCover = mode !== 'resume' && cover !== null

  return (
    <main className={s.shell} data-shell data-template={profile.template}>
      <div
        data-zoom-wrap
        style={{ transform: 'scale(0.75)', transformOrigin: 'top center', display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        {showResume && <ResumeView data={data} boldKeywords={profile.boldKeywords} template={profile.template} />}
        {showCover && <CoverLetterContent data={cover!} resumeName={data.name} boldKeywords={profile.boldKeywords} template={profile.template} />}
      </div>
      {process.env.NODE_ENV === 'development' && <BadgeToggle />}
      <ExportButton name={data.name} hasCover={cover !== null} />
    </main>
  )
}
