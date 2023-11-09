import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useOrganizationPaymentMethodsQuery } from 'data/organizations/organization-payment-methods-query'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { getURL } from 'lib/helpers'
import { Button, IconAlertCircle, IconCreditCard, IconLoader, IconPlus, Listbox } from 'ui'
import AddNewPaymentMethodModal from 'components/interfaces/Billing/Payment/AddNewPaymentMethodModal'

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
  const { ui } = useStore()
  const { ref: projectRef } = useParams()
  const selectedOrganization = useSelectedOrganization()
  const slug = selectedOrganization?.slug
  const [showAddNewPaymentMethodModal, setShowAddNewPaymentMethodModal] = useState(false)

  const {
    data,
    isLoading,
    isSuccess: loadedPaymentMethods,
    refetch: refetchPaymentMethods,
  } = useOrganizationPaymentMethodsQuery({ slug })
  const paymentMethods = useMemo(() => data ?? [], [data])

  const { data: customerProfile, isSuccess: loadedCustomerProfile } =
    useOrganizationCustomerProfileQuery({ slug })

  const canUpdatePaymentMethods = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.payment_methods'
  )

  useEffect(() => {
    if (loadedPaymentMethods && loadedCustomerProfile && paymentMethods.length > 0) {
      const selectedPaymentMethodExists = paymentMethods.some(
        (it) => it.id === selectedPaymentMethod
      )

      if (!selectedPaymentMethod || !selectedPaymentMethodExists) {
        const defaultPaymentMethod = paymentMethods.find(
          (method) => method.id === customerProfile.invoice_settings.default_payment_method
        )
        if (defaultPaymentMethod !== undefined) {
          onSelectPaymentMethod(defaultPaymentMethod.id)
        } else {
          onSelectPaymentMethod(paymentMethods[0].id)
        }
      }
    }
  }, [
    loadedPaymentMethods,
    loadedCustomerProfile,
    selectedPaymentMethod,
    customerProfile,
    paymentMethods,
    onSelectPaymentMethod,
  ])

  return (
    <>
      <div>
        {isLoading ? (
          <div className="flex items-center px-4 py-2 space-x-4 border rounded-md border-strong bg-surface-200">
            <IconLoader className="animate-spin" size={14} />
            <p className="text-sm text-foreground-light">Retrieving payment methods</p>
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="flex items-center justify-between px-4 py-2 border border-dashed rounded-md bg-alternative">
            <div className="flex items-center space-x-4 text-foreground-light">
              <IconAlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm">No saved payment methods</p>
            </div>

            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <Button
                  type="default"
                  disabled={!canUpdatePaymentMethods}
                  icon={<IconCreditCard />}
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
            {paymentMethods.map((method: any) => {
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
              <IconPlus size={16} />
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
        onConfirm={async () => {
          setShowAddNewPaymentMethodModal(false)
          ui.setNotification({
            category: 'success',
            message: 'Successfully added new payment method',
          })
          const { data } = await refetchPaymentMethods()
          if (data?.length) {
            // Preselect the card that was just added
            const mostRecentPaymentMethod = data.reduce(
              (prev, current) => (prev.created > current.created ? prev : current),
              data[0]
            )
            onSelectPaymentMethod(mostRecentPaymentMethod.id)
          }
        }}
      />
    </>
  )
}

export default PaymentMethodSelection
