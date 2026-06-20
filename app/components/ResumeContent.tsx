import type { Resume, EducationEntry, ExperienceEntry, ProjectEntry, SkillGroup } from '../types'
import s from './resume.module.css'

export default function ResumeContent({ data, bulletData, boldKeywords = true }: { data: Resume; bulletData?: boolean; boldKeywords?: boolean }) {
  return (
    <>
      <Header name={data.name} contact={data.contact} />
      <Section title="Education">
        {data.education.map((e, i) => <EducationItem key={i} entry={e} />)}
      </Section>
      <Section title="Experience">
        {data.experience.map((e, i) => <ExperienceItem key={i} entry={e} bulletData={bulletData} bold={boldKeywords} />)}
      </Section>
      <Section title="Projects">
        {data.projects.map((e, i) => <ProjectItem key={i} entry={e} bulletData={bulletData} bold={boldKeywords} />)}
      </Section>
      <SkillsSection skills={data.skills} />
      {data.honors && data.honors.length > 0 && (
        <Section title={data.honorsTitle ?? 'Honors & Activities'}>
          <ul className={s.skills}>
            {data.honors.map((h, i) => <li key={i} data-fill-line data-fill-section="honors" data-fill-label={`honors[${i}]`}>{bulletNodes(h, boldKeywords)}</li>)}
          </ul>
        </Section>
      )}
    </>
  )
}

// Render a bullet string, parsing **bold** markers into <strong>. When bold is off,
// the markers are stripped so the text renders plain.
function bulletNodes(text: string, bold: boolean): React.ReactNode {
  if (!bold) return text.replace(/\*\*/g, '')
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(part)
    return m ? <strong key={i}>{m[1]}</strong> : part
  })
}

// Slim header for continuation pages (page 2+) — NOT the page-1 masthead. Name left,
// "Page X of Y" right, rule under. Rendered as ordinary DOM styled from template --vars,
// so it tracks whatever template/font is active (see .runningHeader in resume.module.css).
export function RunningHeader({ name, page, total }: { name: string; page: number; total: number }) {
  return (
    <div className={s.runningHeader} data-running-header>
      <span className={s.runningHeaderName}>{name}</span>
      <span className={s.runningHeaderPage}>Page {page} of {total}</span>
    </div>
  )
}

function Header({ name, contact }: { name: string; contact: Resume['contact'] }) {
  return (
    <header className={s.header}>
      <h1 className={s.name}>{name}</h1>
      <p className={s.contact}>
        {contact.phone}
        <span className={s.sep}> | </span>
        {contact.email}
        <span className={s.sep}> | </span>
        {contact.linkedin}
        <span className={s.sep}> | </span>
        {contact.github}
        {contact.website && (
          <>
            <span className={s.sep}> | </span>
            {contact.website}
          </>
        )}
      </p>
    </header>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}

function EducationItem({ entry }: { entry: EducationEntry }) {
  return (
    <div className={s.entry}>
      <div className={s.entryRow}>
        <span className={s.bold}>{entry.school}</span>
        <span>{entry.location}</span>
      </div>
      <div className={s.entryRow}>
        <span className={s.italic}>{entry.degree}</span>
        <span>{entry.start} – {entry.end}</span>
      </div>
      {entry.gpa && <p className={s.detail} data-fill-line data-fill-section="education" data-fill-label="gpa">GPA: {entry.gpa}</p>}
      {entry.coursework && entry.coursework.length > 0 && (
        <p className={s.detail} data-fill-line data-fill-section="education" data-fill-label="coursework"><span className={s.bold}>Relevant Coursework:</span> {entry.coursework.join(', ')}</p>
      )}
      {entry.leadership && entry.leadership.length > 0 && (
        <p className={s.detail} data-fill-line data-fill-section="education" data-fill-label="leadership"><span className={s.bold}>Leadership:</span> {entry.leadership.join(', ')}</p>
      )}
      {entry.awards && entry.awards.length > 0 && (
        <p className={s.detail} data-fill-line data-fill-section="education" data-fill-label="awards"><span className={s.bold}>Awards:</span> {entry.awards.join(', ')}</p>
      )}
    </div>
  )
}

function ExperienceItem({ entry, bulletData, bold = true }: { entry: ExperienceEntry; bulletData?: boolean; bold?: boolean }) {
  return (
    <div className={s.entry}>
      <div className={s.entryRow}>
        <span className={s.bold}>{entry.company}</span>
        <span>{entry.location}</span>
      </div>
      <div className={s.entryRow}>
        <span className={s.italic}>{entry.title}</span>
        <span>{entry.start} – {entry.end}</span>
      </div>
      <ul className={s.bullets} {...(bulletData ? { 'data-bullets': true } : {})}>
        {entry.bullets.map((b, i) => <li key={i}>{bulletNodes(b, bold)}</li>)}
      </ul>
    </div>
  )
}

function ProjectItem({ entry, bulletData, bold = true }: { entry: ProjectEntry; bulletData?: boolean; bold?: boolean }) {
  return (
    <div className={s.entry}>
      <div className={s.entryRow}>
        <span>
          <span className={s.bold}>{entry.name}</span>
          {' | '}
          <span className={s.tech}>{entry.technologies.join(', ')}</span>
        </span>
        <span>{entry.start} – {entry.end}</span>
      </div>
      <ul className={s.bullets} {...(bulletData ? { 'data-bullets': true } : {})}>
        {entry.bullets.map((b, i) => <li key={i}>{bulletNodes(b, bold)}</li>)}
      </ul>
    </div>
  )
}

function SkillsSection({ skills }: { skills: SkillGroup[] }) {
  return (
    <Section title="Technical Skills">
      <ul className={s.skills}>
        {skills.map(({ label, items }) => (
          <li key={label} data-fill-line data-fill-section="skills" data-fill-label={label}>
            <span className={s.bold}>{label}: </span>
            {items.join(', ')}
          </li>
        ))}
      </ul>
    </Section>
  )
}
