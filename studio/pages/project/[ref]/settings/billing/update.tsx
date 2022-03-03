import { NextPage } from 'next'
import { useState } from 'react'
import { observer } from 'mobx-react-lite'

import { withAuth, useStore } from 'hooks'
import { BillingLayout } from 'components/layouts'
import { Plans } from 'components/interfaces/Billing'

const BillingUpdate: NextPage = () => {
  const { app, ui } = useStore()
  console.log(ui.selectedProject)

  return (
    <BillingLayout>
      <div className="space-y-4">
        <h4 className="text-xl">Change your project's subscription</h4>
        <Plans />
      </div>
    </BillingLayout>
  )
}

export default withAuth(observer(BillingUpdate))
