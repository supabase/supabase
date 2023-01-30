import { FC, useState } from 'react'
import {
  Dropdown,
  IconPlus,
  IconCreditCard,
  Button,
  Input,
  Badge,
  Modal,
  Alert,
  IconMoreHorizontal,
  IconX,
} from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import { delete_, patch } from 'lib/common/fetch'
import { getURL } from 'lib/helpers'
import { API_URL } from 'lib/constants'
import Panel from 'components/ui/Panel'
import { AddNewPaymentMethodModal } from 'components/interfaces/Billing'
import NoPermission from 'components/ui/NoPermission'

interface Props {
  loading: boolean
  defaultPaymentMethod: string
  paymentMethods: any[]
  onDefaultMethodUpdated: (updatedCustomer: any) => void
  onPaymentMethodsDeleted: () => void
}

const PaymentMethods: FC<Props> = ({
  loading,
  defaultPaymentMethod,
  paymentMethods,
  onDefaultMethodUpdated,
  onPaymentMethodsDeleted,
}) => {
  const { ui } = useStore()
  const orgSlug = ui.selectedOrganization?.slug ?? ''

  const [selectedMethodForDefault, setSelectedMethodForDefault] = useState<any>()
  const [selectedMethodToDelete, setSelectedMethodToDelete] = useState<any>()
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false)
  const [isUpdatingPaymentMethod, setIsUpdatingPaymentMethod] = useState(false)

  const canReadPaymentMethods = checkPermissions(
    PermissionAction.BILLING_READ,
    'stripe.payment_methods'
  )
  const canUpdatePaymentMethods = checkPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.payment_methods'
  )

  const onConfirmMakeDefaultPaymentMethod = async () => {
    try {
      setIsUpdatingPaymentMethod(true)
      const updatedCustomer = await patch(`${API_URL}/organizations/${orgSlug}/customer`, {
        invoice_settings: {
          default_payment_method: selectedMethodForDefault.id,
        },
      })
      if (updatedCustomer.error) throw updatedCustomer.error
      onDefaultMethodUpdated(updatedCustomer)
      setSelectedMethodForDefault(undefined)
      ui.setNotification({
        category: 'success',
        message: 'Successfully updated default payment method',
      })
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to make payment method default: ${error.message}`,
      })
    } finally {
      setIsUpdatingPaymentMethod(false)
    }
  }

  const onConfirmDetachPaymentMethod = async () => {
    try {
      setIsUpdatingPaymentMethod(true)
      const { error } = await delete_(`${API_URL}/organizations/${orgSlug}/payments`, {
        card_id: selectedMethodToDelete.id,
      })
      if (error) throw error
      onPaymentMethodsDeleted()
      setSelectedMethodToDelete(undefined)
      ui.setNotification({ category: 'success', message: 'Successfully deleted payment method' })
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete payment method: ${error.message}`,
      })
    } finally {
      setIsUpdatingPaymentMethod(false)
    }
  }

  return (
    <>
      <div className="space-y-2">
        <div>
          <h4>Payment methods</h4>
          <p className="text-sm opacity-50">
            When adding a new payment method, either remove the old one or go to your projects'
            subscription to explicitly update the payment method. Marking a payment method as
            "default" is only relevant for new projects or if there are no other payment methods on
            your account.
          </p>
        </div>
        {!canReadPaymentMethods ? (
          <Panel>
            <NoPermission resourceText="view this organization's payment methods" />
          </Panel>
        ) : (
          <Panel
            loading={loading}
            footer={
              !loading && (
                <div className="flex w-full justify-between">
                  {!canUpdatePaymentMethods ? (
                    <p className="text-sm text-scale-1000">
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
              )
            }
          >
            {loading && paymentMethods.length === 0 ? (
              <div className="flex flex-col justify-between space-y-2 py-4 px-4">
                <div className="shimmering-loader mx-1 w-2/3 rounded py-3" />
                <div className="shimmering-loader mx-1 w-1/2 rounded py-3" />
                <div className="shimmering-loader mx-1 w-1/3 rounded py-3" />
              </div>
            ) : paymentMethods.length >= 1 ? (
              <Panel.Content>
                <div className="space-y-2">
                  {paymentMethods.map((paymentMethod: any) => {
                    const isDefault = paymentMethod.id === defaultPaymentMethod
                    return (
                      <div key={paymentMethod.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                          <img
                            src={`/img/payment-methods/${paymentMethod.card.brand
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
                                <Tooltip.Trigger>
                                  <Button disabled as="span" type="outline" icon={<IconX />} />
                                </Tooltip.Trigger>
                                <Tooltip.Content side="bottom">
                                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                                  <div
                                    className={[
                                      'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                                      'w-48 border border-scale-200 text-center', //border
                                    ].join(' ')}
                                  >
                                    <span className="text-xs text-scale-1200">
                                      Your default payment method cannot be deleted
                                    </span>
                                  </div>
                                </Tooltip.Content>
                              </Tooltip.Root>
                            ) : (
                              <Dropdown
                                size="tiny"
                                overlay={[
                                  <Dropdown.Item
                                    key="make-default"
                                    onClick={() => setSelectedMethodForDefault(paymentMethod)}
                                  >
                                    Make default
                                  </Dropdown.Item>,
                                  <Dropdown.Item
                                    key="delete-method"
                                    onClick={() => setSelectedMethodToDelete(paymentMethod)}
                                  >
                                    Delete
                                  </Dropdown.Item>,
                                ]}
                              >
                                <Button
                                  type="outline"
                                  icon={<IconMoreHorizontal />}
                                  loading={loading}
                                  className="hover:border-gray-500"
                                />
                              </Dropdown>
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
        returnUrl={`${getURL()}/org/${orgSlug}/billing`}
        onCancel={() => setShowAddPaymentMethodModal(false)}
      />

      <Modal
        visible={selectedMethodForDefault !== undefined}
        size="small"
        header="Set payment method as default"
        onCancel={() => setSelectedMethodForDefault(undefined)}
        customFooter={
          <div className="flex items-center gap-2">
            <Button type="default" onClick={() => setSelectedMethodForDefault(undefined)}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={isUpdatingPaymentMethod}
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
            <Button type="default" onClick={() => setSelectedMethodToDelete(undefined)}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={isUpdatingPaymentMethod}
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
