import { UsersV2 } from 'components/interfaces/Auth/Users/UsersV2'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import type { NextPageWithLayout } from 'types'
import { useState } from 'react'
import { Toggle_Shadcn_ } from 'ui'
import { ChartBar } from 'lucide-react'

const UsersPage: NextPageWithLayout = () => {
  const [showChart, setShowChart] = useState(true)
  return (
    <PageLayout
      title="Users"
      isCompact
      size="full"
      secondaryActions={
        <Toggle_Shadcn_
          pressed={showChart}
          onPressedChange={setShowChart}
          aria-label="Toggle users chart visibility"
          variant="outline"
          size="sm"
        >
          <ChartBar strokeWidth={1.5} size={16} />
        </Toggle_Shadcn_>
      }
    >
      <UsersV2 showChart={showChart} />
    </PageLayout>
  )
}

UsersPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default UsersPage
