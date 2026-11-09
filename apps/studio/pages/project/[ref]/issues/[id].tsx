import { IssueDetail } from '@/components/interfaces/Issues/IssueDetail'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { IssuesLayout } from '@/components/layouts/IssuesLayout/IssuesLayout'
import type { NextPageWithLayout } from '@/types'

const IssuePage: NextPageWithLayout = () => <IssueDetail />

IssuePage.getLayout = (page) => (
  <DefaultLayout>
    <IssuesLayout>{page}</IssuesLayout>
  </DefaultLayout>
)

export default IssuePage
