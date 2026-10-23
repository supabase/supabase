import { IssueSettings } from '@/components/interfaces/Issues/IssueSettings'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { IssuesLayout } from '@/components/layouts/IssuesLayout/IssuesLayout'
import type { NextPageWithLayout } from '@/types'

const IssueSettingsPage: NextPageWithLayout = () => <IssueSettings />

IssueSettingsPage.getLayout = (page) => (
  <DefaultLayout>
    <IssuesLayout>{page}</IssuesLayout>
  </DefaultLayout>
)

export default IssueSettingsPage
