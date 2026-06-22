export interface Contact {
  phone: string
  email: string
  linkedin: string
  github?: string
  website?: string
  // City/state (e.g. "Austin, TX"). Optional — rendered as plain text in the contact line
  // (not a link), where the template wants a location alongside the URLs.
  location?: string
}

export interface EducationEntry {
  school: string
  degree: string
  location: string
  // Optional — students usually only need the graduation (end) date. When omitted,
  // the template renders just `end` instead of a "start – end" range.
  start?: string
  end: string
  gpa?: number
  coursework?: string[]
  leadership?: string[]
  // Honors-style line under Education (e.g. competition wins, awards). Renders as an
  // "Awards:" detail line, same labeled-line shape as coursework/leadership.
  awards?: string[]
}

export interface ExperienceEntry {
  company: string
  title: string
  location: string
  start: string
  end: string
  bullets: string[]
}

export interface ProjectEntry {
  name: string
  // Optional repo / live-demo URL. When set, the project name renders as a hyperlink
  // (clickable on screen and in the exported PDF).
  url?: string
  technologies: string[]
  start: string
  end: string
  bullets: string[]
}

// A labeled skills row (e.g. "Languages: Java, Python"). Free-form label so each
// resume can group skills however it likes, rather than a fixed set of categories.
export interface SkillGroup {
  label: string
  items: string[]
}

export interface Resume {
  name: string
  contact: Contact
  // Optional free-text opening paragraph (a "Professional Summary" / profile). Presence-gated —
  // omit it and the section doesn't render. Used by the modern template.
  summary?: string
  // Optional list of short competency phrases rendered as a grid of pills/chips (modern
  // template's "Core Competencies"). `competenciesTitle` names the heading.
  competencies?: string[]
  competenciesTitle?: string
  education: EducationEntry[]
  experience: ExperienceEntry[]
  // Heading for the experience section. Defaults to "Experience"; set to e.g. "Work Experience".
  experienceTitle?: string
  projects: ProjectEntry[]
  skills: SkillGroup[]
  // Heading for the skills section. Defaults to "Technical Skills" when omitted, so
  // existing resumes are unchanged; set it (e.g. "Skills") to match a specific format.
  skillsTitle?: string
  // Optional entries-with-bullets section for leadership / community involvement / volunteer
  // roles — same shape as Experience. Presence-gated (omit it and nothing renders).
  // `leadershipTitle` names the heading; defaults to "Leadership & Community Involvement".
  leadership?: ExperienceEntry[]
  leadershipTitle?: string
  // Optional closing section for honors, awards, leadership, extracurriculars — one line each.
  // `honorsTitle` is the section heading the user wants (e.g. "Leadership", "Awards");
  // defaults to "Honors & Activities" when omitted.
  honors?: string[]
  honorsTitle?: string
}

export type TemplateName = 'jake' | 'compact' | 'cns' | 'business' | 'modern' | 'professional' | 'jake-pro'

// Rendering preferences (profile.yaml). Separate from resume content. Each template bundles
// its own font, so font is not a separate setting:
//   jake     → "Jake's Resume", Calibri 11pt, classic single-column
//   compact  → denser Georgia variant
//   cns      → "UT Austin CNS Resume": the official format from UT Austin's College of Natural
//              Sciences career services (Calibri 12pt, centered name, underlined headings); for
//              UT Austin CNS / STEM undergrads who want their advisors' standard layout.
//   business → "UT Austin Business Resume": the UT Austin business format (Times New Roman 11pt,
//              centered name, rule-underlined headings); for business / McCombs-style students.
//   modern   → "Modern Accent": single-column sans-serif with teal section headings, purple org
//              names, and a teal→purple rule under a left-aligned name; supports an optional
//              Professional Summary and a Core Competencies pill grid. Contemporary but ATS-safe.
//   professional → experience-first post-grad format: clean neutral sans, leading with
//              Experience/Projects/Skills and Education condensed to a single line at the bottom
//              (no GPA/coursework). Summary optional. For graduates with work experience.
//   jake-pro → the classic Jake look (Calibri, centered name) with the SAME experience-first
//              post-grad ordering as `professional`. For Jake fans who've graduated.
export interface Profile {
  template: TemplateName
  // Render **bold** markers in bullets as <strong>. When false, markers are stripped to plain text.
  boldKeywords: boolean
  // Length preference. 'single' (default) — keep the whole resume on one page; treat page
  // overflow as something to resolve (trim/tighten). 'multi' — allow it to flow onto page 2+,
  // where /api/pdf stamps a running header (name + "Page X of Y"). Most new grads want single.
  pages: 'single' | 'multi'
}
