import { FC, useState } from 'react'
import {
  Dropdown,
  IconPlus,
  IconCreditCard,
  Button,
  Input,
  IconLoader,
  Badge,
  Modal,
  Alert,
  IconMoreHorizontal,
  IconX,
} from '@supabase/ui'
import * as Tooltip from '@radix-ui/react-tooltip'

import { useStore } from 'hooks'
import { delete_, patch } from 'lib/common/fetch'
import { getURL } from 'lib/helpers'
import { API_URL } from 'lib/constants'
import Panel from 'components/to-be-cleaned/Panel'
import { AddNewPaymentMethodModal } from 'components/interfaces/Billing'

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
          <p className="text-sm opacity-50">Charges will be deducted from the default card</p>
        </div>
        <Panel
          loading={loading}
          footer={
            !loading && (
              <div>
                <Button
                  key="panel-footer"
                  type="default"
                  icon={<IconPlus />}
                  onClick={() => setShowAddPaymentMethodModal(true)}
                >
                  Add new card
                </Button>
              </div>
            )
          }
        >
          {loading && paymentMethods.length === 0 ? (
            <div className="flex flex-col justify-between space-y-2 py-4 px-4">
              <div className="shimmering-loader rounded py-3 mx-1 w-2/3" />
              <div className="shimmering-loader rounded py-3 mx-1 w-1/2" />
              <div className="shimmering-loader rounded py-3 mx-1 w-1/3" />
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
                        <p className="tabular-nums text-sm">
                          Expires: {paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}
                        </p>
                      </div>
                      {isDefault ? (
                        <Tooltip.Root delayDuration={0}>
                          <Tooltip.Trigger>
                            <Button disabled type="outline" icon={<IconX />} />
                          </Tooltip.Trigger>
                          <Tooltip.Content side="bottom">
                            <Tooltip.Arrow className="radix-tooltip-arrow" />
                            <div
                              className={[
                                'bg-scale-100 shadow py-1 px-2 rounded leading-none', // background
                                'border border-scale-200 w-48 text-center', //border
                              ].join(' ')}
                            >
                              <span className="text-scale-1200 text-xs">
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
                              onClick={() => setSelectedMethodForDefault(paymentMethod)}
                            >
                              Make default
                            </Dropdown.Item>,
                            <Dropdown.Item onClick={() => setSelectedMethodToDelete(paymentMethod)}>
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
      </div>

      <AddNewPaymentMethodModal
        visible={showAddPaymentMethodModal}
        returnUrl={`${getURL()}/org/${orgSlug}/settings`}
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
