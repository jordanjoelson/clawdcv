import type { Resume, EducationEntry, ExperienceEntry, ProjectEntry, Skills } from '../types'
import s from './resume.module.css'

export default function ResumeView({ data }: { data: Resume }) {
  return (
    <div className={s.page}>
      <Header name={data.name} contact={data.contact} />
      <Section title="Education">
        {data.education.map((e, i) => <EducationItem key={i} entry={e} />)}
      </Section>
      <Section title="Experience">
        {data.experience.map((e, i) => <ExperienceItem key={i} entry={e} />)}
      </Section>
      <Section title="Projects">
        {data.projects.map((e, i) => <ProjectItem key={i} entry={e} />)}
      </Section>
      <SkillsSection skills={data.skills} />
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
      {entry.gpa && <p className={s.detail}>GPA: {entry.gpa}</p>}
      {entry.coursework && entry.coursework.length > 0 && (
        <p className={s.detail}>Relevant Coursework: {entry.coursework.join(', ')}</p>
      )}
    </div>
  )
}

function ExperienceItem({ entry }: { entry: ExperienceEntry }) {
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
      <ul className={s.bullets}>
        {entry.bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    </div>
  )
}

function ProjectItem({ entry }: { entry: ProjectEntry }) {
  return (
    <div className={s.entry}>
      <div className={s.entryRow}>
        <span>
          <span className={s.bold}>{entry.name}</span>
          <span className={s.tech}> | {entry.technologies.join(', ')}</span>
        </span>
        <span>{entry.start} – {entry.end}</span>
      </div>
      <ul className={s.bullets}>
        {entry.bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    </div>
  )
}

function SkillsSection({ skills }: { skills: Skills }) {
  const rows: [string, string[]][] = [
    ['Languages', skills.languages],
    ['Frameworks', skills.frameworks],
    ['Developer Tools', skills.tools],
    ['Libraries', skills.libraries],
  ]
  return (
    <Section title="Technical Skills">
      <ul className={s.skills}>
        {rows.map(([label, items]) => (
          <li key={label}>
            <span className={s.bold}>{label}: </span>
            {items.join(', ')}
          </li>
        ))}
      </ul>
    </Section>
  )
}
