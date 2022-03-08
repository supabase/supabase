import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { withAuth, useStore } from 'hooks'

import { BillingLayout } from 'components/layouts'
import { EnterpriseRequest } from 'components/interfaces/Billing'

const BillingUpdateEnterprise: NextPage = () => {
  const { ui } = useStore()
  const router = useRouter()
  const projectRef = ui.selectedProject?.ref

  return (
    <BillingLayout>
      <div className="mx-auto max-w-5xl my-10">
        <EnterpriseRequest
          onSelectBack={() => router.push(`/project/${projectRef}/settings/billing/update`)}
        />
      </div>
    </BillingLayout>
  )
}

export default withAuth(observer(BillingUpdateEnterprise))
