import type { Resume, TemplateName } from '../types'
import PageLayout from './PageLayout'

export default function ResumeView({ data, boldKeywords = true, template = 'jake' }: { data: Resume; boldKeywords?: boolean; template?: TemplateName }) {
  return <PageLayout data={data} boldKeywords={boldKeywords} template={template} />
}
