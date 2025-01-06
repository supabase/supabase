import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import AddNewPaymentMethodModal from 'components/interfaces/Billing/Payment/AddNewPaymentMethodModal'
import { useOrganizationPaymentMethodsQuery } from 'data/organizations/organization-payment-methods-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH } from 'lib/constants'
import { getURL } from 'lib/helpers'
import { Button, Listbox } from 'ui'
import { Loader, AlertCircle, CreditCard, Plus } from 'lucide-react'

export interface PaymentMethodSelectionProps {
  selectedPaymentMethod?: string
  onSelectPaymentMethod: (id: string) => void
  layout?: 'vertical' | 'horizontal'
}

const PaymentMethodSelection = ({
  selectedPaymentMethod,
  onSelectPaymentMethod,
  layout = 'vertical',
}: PaymentMethodSelectionProps) => {
  const selectedOrganization = useSelectedOrganization()
  const slug = selectedOrganization?.slug
  const [showAddNewPaymentMethodModal, setShowAddNewPaymentMethodModal] = useState(false)

  const {
    data: paymentMethods,
    isLoading,
    refetch: refetchPaymentMethods,
  } = useOrganizationPaymentMethodsQuery({ slug })

  const canUpdatePaymentMethods = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.payment_methods'
  )

  useEffect(() => {
    if (paymentMethods?.data && paymentMethods.data.length > 0) {
      const selectedPaymentMethodExists = paymentMethods.data.some(
        (it) => it.id === selectedPaymentMethod
      )

      if (!selectedPaymentMethod || !selectedPaymentMethodExists) {
        const defaultPaymentMethod = paymentMethods.data.find((method) => method.is_default)
        if (defaultPaymentMethod !== undefined) {
          onSelectPaymentMethod(defaultPaymentMethod.id)
        } else {
          onSelectPaymentMethod(paymentMethods.data[0].id)
        }
      }
    }
  }, [selectedPaymentMethod, paymentMethods, onSelectPaymentMethod])

  return (
    <>
      <div>
        {isLoading ? (
          <div className="flex items-center px-4 py-2 space-x-4 border rounded-md border-strong bg-surface-200">
            <Loader className="animate-spin" size={14} />
            <p className="text-sm text-foreground-light">Retrieving payment methods</p>
          </div>
        ) : paymentMethods?.data.length === 0 ? (
          <div className="flex items-center justify-between px-4 py-2 border border-dashed rounded-md bg-alternative">
            <div className="flex items-center space-x-4 text-foreground-light">
              <AlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm">No saved payment methods</p>
            </div>

            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <Button
                  type="default"
                  disabled={!canUpdatePaymentMethods}
                  icon={<CreditCard />}
                  onClick={() => setShowAddNewPaymentMethodModal(true)}
                  htmlType="button"
                >
                  Add new
                </Button>
              </Tooltip.Trigger>
              {!canUpdatePaymentMethods && (
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                        'w-48 border border-background text-center', //border
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        You need additional permissions to add new payment methods to this
                        organization
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
        ) : (
          <Listbox
            layout={layout}
            label="Payment method"
            value={selectedPaymentMethod}
            onChange={onSelectPaymentMethod}
            className="flex items-center"
          >
            {paymentMethods?.data.map((method: any) => {
              const label = `•••• •••• •••• ${method.card.last4}`
              return (
                <Listbox.Option
                  key={method.id}
                  label={label}
                  value={method.id}
                  addOnBefore={() => {
                    return (
                      <img
                        alt="Credit Card Brand"
                        src={`${BASE_PATH}/img/payment-methods/${method.card.brand
                          .replace(' ', '-')
                          .toLowerCase()}.png`}
                        width="32"
                      />
                    )
                  }}
                >
                  <div>{label}</div>
                </Listbox.Option>
              )
            })}
            <div
              className="flex items-center px-3 py-2 space-x-2 transition cursor-pointer group hover:bg-surface-300"
              onClick={() => setShowAddNewPaymentMethodModal(true)}
            >
              <Plus size={16} />
              <p className="transition text-foreground-light group-hover:text-foreground">
                Add new payment method
              </p>
            </div>
          </Listbox>
        )}
      </div>

      <AddNewPaymentMethodModal
        visible={showAddNewPaymentMethodModal}
        returnUrl={`${getURL()}/org/${selectedOrganization?.slug}/billing?panel=subscriptionPlan`}
        onCancel={() => setShowAddNewPaymentMethodModal(false)}
        autoMarkAsDefaultPaymentMethod={true}
        onConfirm={async () => {
          setShowAddNewPaymentMethodModal(false)
          toast.success('Successfully added new payment method')
          const { data: refetchedPaymentMethods } = await refetchPaymentMethods()
          if (refetchedPaymentMethods?.data?.length) {
            // Preselect the card that was just added
            const mostRecentPaymentMethod = refetchedPaymentMethods?.data.reduce(
              (prev, current) => (prev.created > current.created ? prev : current),
              refetchedPaymentMethods.data[0]
            )
            onSelectPaymentMethod(mostRecentPaymentMethod.id)
          }
        }}
      />
    </>
  )
}

export default PaymentMethodSelection
