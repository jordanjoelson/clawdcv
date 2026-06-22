import type { Resume, EducationEntry, ExperienceEntry, ProjectEntry, SkillGroup, TemplateName } from '../types'
import s from './resume.module.css'

// Entry layout family. Templates pick one; the styling (font/color) is layered on via CSS.
//   jake   — classic two columns: [company | location] then [title | dates]
//   ut     — UT Austin .docx format: [company, location | dates] then [title]
//   modern — [company | dates] then [title | location]; projects render as prose + a tech line
type Layout = 'jake' | 'ut' | 'modern'

function layoutFor(template: TemplateName): Layout {
  if (template === 'modern') return 'modern'
  if (template === 'cns' || template === 'business') return 'ut'
  return 'jake'
}

export default function ResumeContent({ data, bulletData, boldKeywords = true, template = 'jake' }: { data: Resume; bulletData?: boolean; boldKeywords?: boolean; template?: TemplateName }) {
  const layout = layoutFor(template)
  // The professional templates lead with Experience and demote Education to a single condensed
  // line at the bottom (the standard post-grad / experienced format). `jake-pro` is the same
  // ordering wearing the classic Jake styling. Every other template keeps Education first.
  const pro = template === 'professional' || template === 'jake-pro'
  const eduLayout: Layout | 'condensed' = pro ? 'condensed' : layout

  const summaryNode = data.summary ? (
    <Section key="summary" title="Professional Summary">
      <p className={s.summary}>{data.summary}</p>
    </Section>
  ) : null
  const competenciesNode = data.competencies && data.competencies.length > 0 ? (
    <Section key="competencies" title={data.competenciesTitle ?? 'Core Competencies'}>
      <ul className={s.competencies}>
        {data.competencies.map((c, i) => <li key={i} className={s.pill}>{c}</li>)}
      </ul>
    </Section>
  ) : null
  const educationNode = (
    <Section key="education" title="Education">
      {data.education.map((e, i) => <EducationItem key={i} entry={e} layout={eduLayout} />)}
    </Section>
  )
  const experienceNode = (
    <Section key="experience" title={data.experienceTitle ?? 'Experience'}>
      {data.experience.map((e, i) => <ExperienceItem key={i} entry={e} bulletData={bulletData} bold={boldKeywords} layout={layout} />)}
    </Section>
  )
  const projectsNode = data.projects && data.projects.length > 0 ? (
    <Section key="projects" title="Projects">
      {data.projects.map((e, i) => <ProjectItem key={i} entry={e} bulletData={bulletData} bold={boldKeywords} layout={layout} />)}
    </Section>
  ) : null
  const leadershipNode = data.leadership && data.leadership.length > 0 ? (
    <Section key="leadership" title={data.leadershipTitle ?? 'Leadership & Community Involvement'}>
      {data.leadership.map((e, i) => <ExperienceItem key={i} entry={e} bulletData={bulletData} bold={boldKeywords} layout={layout} />)}
    </Section>
  ) : null
  const skillsNode = <SkillsSection key="skills" skills={data.skills} title={data.skillsTitle ?? 'Technical Skills'} />
  const honorsNode = data.honors && data.honors.length > 0 ? (
    <Section key="honors" title={data.honorsTitle ?? 'Honors & Activities'}>
      <ul className={s.skills}>
        {data.honors.map((h, i) => <li key={i} data-fill-line data-fill-section="honors" data-fill-label={`honors[${i}]`}>{bulletNodes(h, boldKeywords)}</li>)}
      </ul>
    </Section>
  ) : null

  const body = pro
    ? [summaryNode, competenciesNode, experienceNode, projectsNode, leadershipNode, skillsNode, educationNode, honorsNode]
    : [summaryNode, competenciesNode, educationNode, experienceNode, projectsNode, leadershipNode, skillsNode, honorsNode]

  return (
    <>
      <Header name={data.name} contact={data.contact} />
      {body}
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

// Turn a contact value or project URL into a working absolute href: emails get `mailto:`, and
// scheme-less domains get `https://`. Without this a bare `linkedin.com/in/you` renders as a
// relative link that resolves against the host (localhost) and breaks — on screen and in the PDF.
function toHref(value: string): string {
  const v = value.trim()
  if (/^(https?:|mailto:|tel:)/i.test(v)) return v
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`
  return `https://${v}`
}

function Header({ name, contact }: { name: string; contact: Resume['contact'] }) {
  // Render only the fields that are present, joined by " | ". URL-like fields get the .link
  // class (underlined in templates whose source shows them as hyperlinks, e.g. business);
  // phone and location are plain text. Order matches the prior layout, with location last.
  const parts: { text: string; link: boolean }[] = [
    { text: contact.phone, link: false },
    { text: contact.email, link: true },
    { text: contact.linkedin, link: true },
    contact.github ? { text: contact.github, link: true } : null,
    contact.website ? { text: contact.website, link: true } : null,
    contact.location ? { text: contact.location, link: false } : null,
  ].filter((p): p is { text: string; link: boolean } => p !== null && Boolean(p.text))
  return (
    <header className={s.header}>
      <h1 className={s.name}>{name}</h1>
      <p className={s.contact}>
        {parts.map((p, i) => (
          <span key={i}>
            {i > 0 && <span className={s.sep}> | </span>}
            {p.link ? <a className={s.link} href={toHref(p.text)} target="_blank" rel="noopener noreferrer">{p.text}</a> : p.text}
          </span>
        ))}
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

function EducationDetails({ entry }: { entry: EducationEntry }) {
  return (
    <>
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
    </>
  )
}

// Education date display: a "start – end" range when a start date exists, otherwise just the
// end (graduation) date — so a student can omit `start` without leaving a dangling dash.
function eduDateRange(entry: EducationEntry): string {
  return entry.start ? `${entry.start} – ${entry.end}` : entry.end
}

function EducationItem({ entry, layout }: { entry: EducationEntry; layout: Layout | 'condensed' }) {
  if (layout === 'condensed') {
    // One line, no GPA/coursework — the post-grad/professional treatment.
    return (
      <div className={s.entry}>
        <div className={s.entryRow}>
          <span><span className={s.bold}>{entry.degree}</span>, {entry.school}</span>
          <span>{entry.end}</span>
        </div>
      </div>
    )
  }
  if (layout === 'modern') {
    return (
      <div className={s.entry}>
        <div className={s.entryRow}>
          <span><span className={s.bold}>{entry.degree}</span>{' – '}<span className={s.accentName}>{entry.school}</span></span>
          <span className={s.muted}>{eduDateRange(entry)}</span>
        </div>
        <EducationDetails entry={entry} />
      </div>
    )
  }
  if (layout === 'ut') {
    return (
      <div className={s.entry}>
        <div className={s.entryRow}>
          <span><span className={`${s.bold} ${s.accentName}`}>{entry.school}</span>, {entry.location}</span>
          <span>{eduDateRange(entry)}</span>
        </div>
        <div className={s.italic}>{entry.degree}</div>
        <EducationDetails entry={entry} />
      </div>
    )
  }
  return (
    <div className={s.entry}>
      <div className={s.entryRow}>
        <span className={`${s.bold} ${s.accentName}`}>{entry.school}</span>
        <span>{entry.location}</span>
      </div>
      <div className={s.entryRow}>
        <span className={s.italic}>{entry.degree}</span>
        <span>{eduDateRange(entry)}</span>
      </div>
      <EducationDetails entry={entry} />
    </div>
  )
}

function ExperienceItem({ entry, bulletData, bold = true, layout }: { entry: ExperienceEntry; bulletData?: boolean; bold?: boolean; layout: Layout }) {
  const bullets = (
    <ul className={s.bullets} {...(bulletData ? { 'data-bullets': true } : {})}>
      {entry.bullets.map((b, i) => <li key={i}>{bulletNodes(b, bold)}</li>)}
    </ul>
  )
  if (layout === 'modern') {
    return (
      <div className={s.entry}>
        <div className={s.entryRow}>
          <span className={`${s.bold} ${s.accentName}`}>{entry.company}</span>
          <span className={s.muted}>{entry.start} – {entry.end}</span>
        </div>
        <div><span className={s.bold}>{entry.title}</span><span className={s.muted}> | {entry.location}</span></div>
        {bullets}
      </div>
    )
  }
  if (layout === 'ut') {
    return (
      <div className={s.entry}>
        <div className={s.entryRow}>
          <span><span className={`${s.bold} ${s.accentName}`}>{entry.company}</span>, {entry.location}</span>
          <span>{entry.start} – {entry.end}</span>
        </div>
        <div className={s.italic}>{entry.title}</div>
        {bullets}
      </div>
    )
  }
  return (
    <div className={s.entry}>
      <div className={s.entryRow}>
        <span className={`${s.bold} ${s.accentName}`}>{entry.company}</span>
        <span>{entry.location}</span>
      </div>
      <div className={s.entryRow}>
        <span className={s.italic}>{entry.title}</span>
        <span>{entry.start} – {entry.end}</span>
      </div>
      {bullets}
    </div>
  )
}

// Project name, hyperlinked to its repo / live demo when `url` is set (clickable on screen and
// in the exported PDF), otherwise plain text. Same bold/accent styling either way.
function projectName(entry: ProjectEntry): React.ReactNode {
  const cls = `${s.bold} ${s.accentName}`
  return entry.url
    ? <a className={cls} href={toHref(entry.url)} target="_blank" rel="noopener noreferrer">{entry.name}</a>
    : <span className={cls}>{entry.name}</span>
}

function ProjectItem({ entry, bulletData, bold = true, layout }: { entry: ProjectEntry; bulletData?: boolean; bold?: boolean; layout: Layout }) {
  // Modern shows the project name, the description as flowing prose (no bullet markers), then a
  // muted technologies line beneath — no dates. Other layouts keep the name | tech header with
  // dates on the right and a bulleted list below.
  if (layout === 'modern') {
    return (
      <div className={s.entry}>
        <div className={s.entryRow}>
          {projectName(entry)}
        </div>
        <p className={s.projectDesc}>
          {entry.bullets.map((b, i) => <span key={i}>{i > 0 ? ' ' : ''}{bulletNodes(b, bold)}</span>)}
        </p>
        {entry.technologies.length > 0 && <p className={s.techLine}>{entry.technologies.join(', ')}</p>}
      </div>
    )
  }
  return (
    <div className={s.entry}>
      <div className={s.entryRow}>
        <span>
          {projectName(entry)}
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

function SkillsSection({ skills, title }: { skills: SkillGroup[]; title: string }) {
  return (
    <Section title={title}>
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
