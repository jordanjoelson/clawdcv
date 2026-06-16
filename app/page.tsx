import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import type { Resume } from './types'
import ResumeView from './components/Resume'
import GeometryCapture from './components/GeometryCapture'
import s from './components/resume.module.css'

export const dynamic = 'force-dynamic'

export default function Page() {
  const filePath = path.join(process.cwd(), 'resume.yaml')
  const raw = fs.readFileSync(filePath, 'utf-8')
  const data = yaml.load(raw) as Resume

  return (
    <main className={s.shell}>
      <ResumeView data={data} />
      {process.env.NODE_ENV === 'development' && <GeometryCapture data={data} />}
    </main>
  )
}
