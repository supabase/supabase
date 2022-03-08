import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { withAuth, useStore } from 'hooks'

import { BillingLayout } from 'components/layouts'
import { ExitSurvey } from 'components/interfaces/Billing'
import { useEffect } from 'react'

const BillingUpdateFree: NextPage = () => {
  const { ui } = useStore()
  const router = useRouter()
  const projectRef = ui.selectedProject?.ref

  // [TODO] If project is already free, redirect back to plan selection and show push notification

  return (
    <BillingLayout>
      <div className="mx-auto max-w-5xl my-10">
        <ExitSurvey
          onSelectBack={() => router.push(`/project/${projectRef}/settings/billing/update`)}
        />
      </div>
    </BillingLayout>
  )
}

export default withAuth(observer(BillingUpdateFree))
