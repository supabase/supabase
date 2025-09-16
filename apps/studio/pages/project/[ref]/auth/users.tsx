import { ChartBar } from 'lucide-react'
import { useState } from 'react'
import { Toggle_Shadcn_, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { UsersV2 } from 'components/interfaces/Auth/Users/UsersV2'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import type { NextPageWithLayout } from 'types'

const UsersPage: NextPageWithLayout = () => {
  const [showChart, setShowChart] = useState(true)

  return (
    <PageLayout
      title="Users"
      isCompact
      size="full"
      secondaryActions={
        <Tooltip>
          <TooltipTrigger>
            <Toggle_Shadcn_
              asChild
              pressed={showChart}
              onPressedChange={setShowChart}
              aria-label="Toggle users chart visibility"
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
            >
              <div>
                <ChartBar strokeWidth={1.5} size={14} />
              </div>
            </Toggle_Shadcn_>
          </TooltipTrigger>
          <TooltipContent side="left">
            {showChart ? 'Hide' : 'Show'} number of user sign ups over last 7 days
          </TooltipContent>
        </Tooltip>
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
