import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconCreditCard,
  IconMoreHorizontal,
  IconPlus,
  IconX,
  Input,
  Modal,
} from 'ui'

import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from 'data/organizations/organization-customer-profile-update-mutation'
import { useOrganizationPaymentMethodDeleteMutation } from 'data/organizations/organization-payment-method-delete-mutation'
import { useOrganizationPaymentMethodsQuery } from 'data/organizations/organization-payment-methods-query'
import { useCheckPermissions, useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { getURL } from 'lib/helpers'
import AddNewPaymentMethodModal from 'components/interfaces/Billing/Payment/AddNewPaymentMethodModal'

const PaymentMethods = () => {
  const { ui } = useStore()
  const { slug } = useParams()

  const [selectedMethodForDefault, setSelectedMethodForDefault] = useState<any>()
  const [selectedMethodToDelete, setSelectedMethodToDelete] = useState<any>()
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false)

  const { mutate: updateCustomerProfile, isLoading: isUpdating } =
    useOrganizationCustomerProfileUpdateMutation({
      onSuccess: (updatedCustomer) => {
        setSelectedMethodForDefault(undefined)
        ui.setNotification({
          category: 'success',
          message: 'Successfully updated default payment method',
        })
      },
      onError: (error) => {
        ui.setNotification({
          category: 'error',
          message: `Failed to make payment method default: ${error.message}`,
        })
      },
    })

  const { mutate: deletePaymentMethod, isLoading: isDeleting } =
    useOrganizationPaymentMethodDeleteMutation({
      onSuccess: () => {
        setSelectedMethodToDelete(undefined)
        ui.setNotification({ category: 'success', message: 'Successfully deleted payment method' })
      },
    })

  const { data: customer } = useOrganizationCustomerProfileQuery({ slug })

  const {
    data,
    error: paymentMethodsError,
    refetch: refetchPaymentMethods,
    isLoading: isLoadingPaymentMethods,
    isError: isErrorPaymentMethods,
    isSuccess: isSuccessPaymentMethods,
  } = useOrganizationPaymentMethodsQuery({ slug })
  const paymentMethods = data || []

  const defaultPaymentMethod = customer?.invoice_settings?.default_payment_method ?? ''

  const canReadPaymentMethods = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.payment_methods'
  )
  const canUpdatePaymentMethods = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.payment_methods'
  )

  const onConfirmMakeDefaultPaymentMethod = () => {
    if (!slug) return console.error('Slug is required')
    updateCustomerProfile({
      slug,
      invoice_settings: {
        default_payment_method: selectedMethodForDefault.id,
      },
    })
  }

  const onConfirmDetachPaymentMethod = () => {
    if (!slug) return console.error('Slug is required')
    deletePaymentMethod({ slug, cardId: selectedMethodToDelete.id })
  }

  const onLocalPaymentMethodAdded = () => {
    setShowAddPaymentMethodModal(false)
    ui.setNotification({ category: 'success', message: 'Successfully added new payment method' })
    return refetchPaymentMethods()
  }

  return (
    <>
      <div className="space-y-2 -mb-8">
        <div>
          <h4>Payment methods</h4>
          <p className="text-sm opacity-50">
            When adding a new payment method, either remove the old one or go to your projects'
            subscription to explicitly update the payment method. Marking a payment method as
            "default" is only relevant for new projects or if there are no other payment methods on
            your account.
          </p>
        </div>

        {!isLoadingPaymentMethods && !canReadPaymentMethods && (
          <Panel>
            <NoPermission resourceText="view this organization's payment methods" />
          </Panel>
        )}

        {isLoadingPaymentMethods && <GenericSkeletonLoader />}

        {isErrorPaymentMethods && (
          <AlertError error={paymentMethodsError} subject="Failed to retrieve payment methods" />
        )}

        {isSuccessPaymentMethods && (
          <Panel
            footer={
              <div className="flex w-full justify-between">
                {!canUpdatePaymentMethods ? (
                  <p className="text-sm text-foreground-light">
                    You need additional permissions to manage this organization's payment methods
                  </p>
                ) : (
                  <div />
                )}
                <div>
                  <Button
                    key="panel-footer"
                    type="default"
                    icon={<IconPlus />}
                    disabled={!canUpdatePaymentMethods}
                    onClick={() => setShowAddPaymentMethodModal(true)}
                  >
                    Add new card
                  </Button>
                </div>
              </div>
            }
          >
            {paymentMethods.length >= 1 ? (
              <Panel.Content>
                <div className="space-y-2">
                  {paymentMethods.map((paymentMethod: any) => {
                    const isDefault = paymentMethod.id === defaultPaymentMethod
                    return (
                      <div key={paymentMethod.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                          <img
                            alt="Credit card brand"
                            src={`${BASE_PATH}/img/payment-methods/${paymentMethod.card.brand
                              .replace(' ', '-')
                              .toLowerCase()}.png`}
                            width="32"
                          />
                          <Input
                            readOnly
                            className="w-64"
                            size="small"
                            value={`•••• •••• •••• ${paymentMethod.card.last4}`}
                          />
                          {isDefault ? (
                            <Badge color="gray">Default</Badge>
                          ) : (
                            <div className="opacity-0">
                              <Badge color="gray">Default</Badge>
                            </div>
                          )}
                          <p className="text-sm tabular-nums">
                            Expires: {paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}
                          </p>
                        </div>
                        {canUpdatePaymentMethods && (
                          <>
                            {isDefault ? (
                              <Tooltip.Root delayDuration={0}>
                                <Tooltip.Trigger asChild>
                                  <Button disabled type="outline" icon={<IconX />} />
                                </Tooltip.Trigger>
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
                                        Your default payment method cannot be deleted
                                      </span>
                                    </div>
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger>
                                  <Button
                                    type="outline"
                                    icon={<IconMoreHorizontal />}
                                    loading={isLoadingPaymentMethods}
                                    className="hover:border-gray-500"
                                  />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    key="make-default"
                                    onClick={() => setSelectedMethodForDefault(paymentMethod)}
                                  >
                                    <p>Make default</p>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    key="delete-method"
                                    onClick={() => setSelectedMethodToDelete(paymentMethod)}
                                  >
                                    <p>Delete</p>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Panel.Content>
            ) : (
              <Panel.Content>
                <div className="flex items-center space-x-2 opacity-50">
                  <IconCreditCard />
                  <p className="text-sm">No payment methods</p>
                </div>
              </Panel.Content>
            )}
          </Panel>
        )}
      </div>

      <AddNewPaymentMethodModal
        visible={showAddPaymentMethodModal}
        returnUrl={`${getURL()}/org/${slug}/billing`}
        onCancel={() => setShowAddPaymentMethodModal(false)}
        onConfirm={() => onLocalPaymentMethodAdded()}
      />

      <Modal
        visible={selectedMethodForDefault !== undefined}
        size="small"
        header="Set payment method as default"
        onCancel={() => setSelectedMethodForDefault(undefined)}
        customFooter={
          <div className="flex items-center gap-2">
            <Button
              type="default"
              disabled={isUpdating}
              onClick={() => setSelectedMethodForDefault(undefined)}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              disabled={isUpdating}
              loading={isUpdating}
              onClick={onConfirmMakeDefaultPaymentMethod}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <div className="py-4">
          <Modal.Content>
            <p className="text-sm">
              Confirm to set selected payment method (Ending with{' '}
              {selectedMethodForDefault?.card?.last4 ?? ''}) as the default?
            </p>
          </Modal.Content>
        </div>
      </Modal>

      <Modal
        visible={selectedMethodToDelete !== undefined}
        size="medium"
        header="Delete payment method"
        onCancel={() => setSelectedMethodToDelete(undefined)}
        customFooter={
          <div className="flex items-center gap-2">
            <Button
              type="default"
              disabled={isDeleting}
              onClick={() => setSelectedMethodToDelete(undefined)}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              disabled={isDeleting}
              loading={isDeleting}
              onClick={onConfirmDetachPaymentMethod}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <div className="py-4">
          <Modal.Content>
            <Alert
              withIcon
              variant="warning"
              title="This will permanently delete your payment method."
            >
              <p className="">
                Any subscription currently charging this payment method will start charging your
                default payment method.
              </p>
            </Alert>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default PaymentMethods
