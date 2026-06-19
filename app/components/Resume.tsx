import type { Resume } from '../types'
import PageLayout from './PageLayout'

export default function ResumeView({ data, boldKeywords = true }: { data: Resume; boldKeywords?: boolean }) {
  return <PageLayout data={data} boldKeywords={boldKeywords} />
}
