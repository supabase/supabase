import { IssuesOverview } from '@/components/interfaces/Issues/IssuesOverview'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { IssuesLayout } from '@/components/layouts/IssuesLayout/IssuesLayout'
import type { NextPageWithLayout } from '@/types'

const IssuesPage: NextPageWithLayout = () => <IssuesOverview />

IssuesPage.getLayout = (page) => (
  <DefaultLayout>
    <IssuesLayout>{page}</IssuesLayout>
  </DefaultLayout>
)

export default IssuesPage
