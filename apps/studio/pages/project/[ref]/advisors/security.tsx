import { IssuesCategoryRedirect } from '@/components/interfaces/Issues/IssuesCategoryRedirect'
import type { NextPageWithLayout } from '@/types'

const AdvisorsSecurityPage: NextPageWithLayout = () => (
  <IssuesCategoryRedirect category="security" />
)

export default AdvisorsSecurityPage
