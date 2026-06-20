export interface Contact {
  phone: string
  email: string
  linkedin: string
  github: string
  website?: string
}

export interface EducationEntry {
  school: string
  degree: string
  location: string
  start: string
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
  education: EducationEntry[]
  experience: ExperienceEntry[]
  projects: ProjectEntry[]
  skills: SkillGroup[]
  // Optional closing section for honors, awards, leadership, extracurriculars — one line each.
  // `honorsTitle` is the section heading the user wants (e.g. "Leadership", "Awards");
  // defaults to "Honors & Activities" when omitted.
  honors?: string[]
  honorsTitle?: string
}

export type TemplateName = 'jake' | 'compact'

// Rendering preferences (profile.yaml). Separate from resume content. Each template bundles
// its own font (jake → Calibri, compact → Georgia), so font is not a separate setting.
export interface Profile {
  template: TemplateName
  // Render **bold** markers in bullets as <strong>. When false, markers are stripped to plain text.
  boldKeywords: boolean
  // Length preference. 'single' (default) — keep the whole resume on one page; treat page
  // overflow as something to resolve (trim/tighten). 'multi' — allow it to flow onto page 2+,
  // where /api/pdf stamps a running header (name + "Page X of Y"). Most new grads want single.
  pages: 'single' | 'multi'
}
