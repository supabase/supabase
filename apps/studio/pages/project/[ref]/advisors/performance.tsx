import { IssuesCategoryRedirect } from '@/components/interfaces/Issues/IssuesCategoryRedirect'
import type { NextPageWithLayout } from '@/types'

const AdvisorsPerformancePage: NextPageWithLayout = () => (
  <IssuesCategoryRedirect category="performance" />
)

export default AdvisorsPerformancePage
