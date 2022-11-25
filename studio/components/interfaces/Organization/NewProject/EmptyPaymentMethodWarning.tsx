import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconAlertCircle } from 'ui'

import { useStore } from 'hooks'
import { getURL } from 'lib/helpers'
import InformationBox from 'components/ui/InformationBox'
import { AddNewPaymentMethodModal } from 'components/interfaces/Billing'

const EmptyPaymentMethodWarning = observer(
  ({ stripeCustomerId }: { stripeCustomerId: string | undefined }) => {
    const { ui } = useStore()
    const slug = ui.selectedOrganization?.slug

    const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState<boolean>(false)

    return (
      <div className="mt-4">
        <InformationBox
          icon={<IconAlertCircle className="text-white" size="large" strokeWidth={1.5} />}
          defaultVisibility={true}
          hideCollapse
          title="Your organization has no payment methods"
          description={
            <div className="space-y-3">
              <p className="text-sm leading-normal">
                You need to add a payment method for your organization before creating a paid
                project.
              </p>
              <Button type="secondary" onClick={() => setShowAddPaymentMethodModal(true)}>
                Add a payment method
              </Button>
            </div>
          }
        />
        <AddNewPaymentMethodModal
          visible={showAddPaymentMethodModal}
          returnUrl={`${getURL()}/new/${slug}`}
          onCancel={() => setShowAddPaymentMethodModal(false)}
        />
      </div>
    )
  }
)

export default EmptyPaymentMethodWarning
