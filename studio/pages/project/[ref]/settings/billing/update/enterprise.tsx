import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { useStore } from 'hooks'

import { BillingLayout } from 'components/layouts'
import { EnterpriseRequest } from 'components/interfaces/Billing'
import { NextPageWithLayout } from 'types'

const BillingUpdateEnterprise: NextPageWithLayout = () => {
  const { ui } = useStore()
  const router = useRouter()
  const projectRef = ui.selectedProject?.ref

  return (
    <div className="mx-auto my-10 max-w-5xl">
      <EnterpriseRequest
        onSelectBack={() => router.push(`/project/${projectRef}/settings/billing/update`)}
      />
    </div>
  )
}

BillingUpdateEnterprise.getLayout = (page) => <BillingLayout>{page}</BillingLayout>

export default observer(BillingUpdateEnterprise)
