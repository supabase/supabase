import { useState } from 'react'

import { AddNewPaymentMethodModal } from 'components/interfaces/BillingV2'
import InformationBox from 'components/ui/InformationBox'
import { useSelectedOrganization } from 'hooks'
import { getURL } from 'lib/helpers'
import { Button, IconAlertCircle } from 'ui'

const EmptyPaymentMethodWarning = ({
  onPaymentMethodAdded,
}: {
  onPaymentMethodAdded: () => void
}) => {
  const selectedOrganization = useSelectedOrganization()
  const slug = selectedOrganization?.slug

  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState<boolean>(false)

  const onLocalPaymentMethodAdded = () => {
    setShowAddPaymentMethodModal(false)

    return onPaymentMethodAdded()
  }

  return (
    <div className="mt-4">
      <InformationBox
        icon={<IconAlertCircle size="large" strokeWidth={1.5} />}
        defaultVisibility={true}
        hideCollapse
        title="Your organization has no payment methods"
        description={
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              You need to add a payment method for your organization before creating a paid project.
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
        onConfirm={() => onLocalPaymentMethodAdded()}
      />
    </div>
  )
}

export default EmptyPaymentMethodWarning
