import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import type { Resume } from './types'
import ResumeView from './components/Resume'
import ExportButton from './components/ExportButton'
import BadgeToggle from './components/BadgeToggle'
import s from './components/resume.module.css'

export const dynamic = 'force-dynamic'

export default function Page() {
  const filePath = path.join(process.cwd(), 'resume.yaml')
  const raw = fs.readFileSync(filePath, 'utf-8')
  const data = yaml.load(raw) as Resume

  return (
    <main className={s.shell} data-shell>
      <div data-zoom-wrap style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}>
        <ResumeView data={data} />
      </div>
      {process.env.NODE_ENV === 'development' && <BadgeToggle />}
      <ExportButton />
    </main>
  )
}
