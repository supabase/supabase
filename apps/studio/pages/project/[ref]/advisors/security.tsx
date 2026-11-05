import { IssuesCategoryRedirect } from '@/components/interfaces/Issues/IssuesCategoryRedirect'
import type { NextPageWithLayout } from '@/types'

// Security Advisor findings are issues now; this page keeps old links working
const AdvisorsSecurityPage: NextPageWithLayout = () => (
  <IssuesCategoryRedirect category="security" />
)

export default AdvisorsSecurityPage
