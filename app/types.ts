export interface Contact {
  phone: string
  email: string
  linkedin: string
  github: string
}

export interface EducationEntry {
  school: string
  degree: string
  location: string
  start: string
  end: string
  gpa?: number
  coursework?: string[]
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

export interface Skills {
  languages: string[]
  frameworks: string[]
  tools: string[]
  libraries: string[]
}

export interface Resume {
  name: string
  contact: Contact
  education: EducationEntry[]
  experience: ExperienceEntry[]
  projects: ProjectEntry[]
  skills: Skills
}

export type TemplateName = 'jake' | 'compact'
export type FontName = 'calibri' | 'times' | 'georgia' | 'cambria' | 'arial'

// Rendering preferences (profile.yaml). Separate from resume content.
export interface Profile {
  template: TemplateName
  font: FontName
  // Render **bold** markers in bullets as <strong>. When false, markers are stripped to plain text.
  boldKeywords: boolean
}
