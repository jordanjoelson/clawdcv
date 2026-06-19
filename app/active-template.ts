// Which resume template renders, app-wide. Flip this one value to switch styles —
// the structure and content (resume.yaml) stay identical; only the look changes.
//   'jake'    — original Calibri, roomy spacing (default)
//   'compact' — denser Georgia variant
// See the [data-template="..."] blocks in app/components/resume.module.css.
export type TemplateName = 'jake' | 'compact'

export const ACTIVE_TEMPLATE: TemplateName = 'compact'
