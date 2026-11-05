import { IssuesCategoryRedirect } from '@/components/interfaces/Issues/IssuesCategoryRedirect'
import type { NextPageWithLayout } from '@/types'

// Performance Advisor findings are issues now; this page keeps old links working
const AdvisorsPerformancePage: NextPageWithLayout = () => (
  <IssuesCategoryRedirect category="performance" />
)

export default AdvisorsPerformancePage
