import { IssuesCategoryRedirect } from '@/components/interfaces/Issues/IssuesCategoryRedirect'
import type { NextPageWithLayout } from '@/types'

// Health Advisor findings are issues now; this page keeps old links working
const AdvisorsHealthPage: NextPageWithLayout = () => <IssuesCategoryRedirect category="health" />

export default AdvisorsHealthPage
