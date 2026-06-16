import type { Resume } from '../types'
import PageLayout from './PageLayout'

export default function ResumeView({ data }: { data: Resume }) {
  return <PageLayout data={data} />
}
