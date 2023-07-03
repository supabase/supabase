import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { useParams } from 'common'
import { AddNewPaymentMethodModal } from 'components/interfaces/Billing'
import { FormPanel, FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import { organizationKeys } from 'data/organizations/keys'
import { useOrganizationPaymentMethodsQuery } from 'data/organizations/organization-payment-methods-query'
import { useCheckPermissions, useStore } from 'hooks'
import { getURL } from 'lib/helpers'
import { Badge, Button, Dropdown, IconCreditCard, IconMoreHorizontal, IconPlus, Input } from 'ui'
import { BASE_PATH } from 'lib/constants'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import DeletePaymentMethodModal from './DeletePaymentMethodModal'

// [TODO] Implement change credit card for org subscription logic

const PaymentMethods = () => {
  const { ui } = useStore()
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const [selectedMethodForDefault, setSelectedMethodForDefault] = useState<any>()
  const [selectedMethodToDelete, setSelectedMethodToDelete] = useState<any>()
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false)

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: slug })
  const {
    data: paymentMethods,
    isLoading,
    isError,
    isSuccess,
  } = useOrganizationPaymentMethodsQuery({ slug })

  const canReadPaymentMethods = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.payment_methods'
  )
  const canUpdatePaymentMethods = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.payment_methods'
  )

  return (
    <>
      <FormSection
        id="payment-methods"
        header={
          <FormSectionLabel>
            <div className="sticky space-y-6 top-16">
              <div>
                <p className="text-base">Payment methods</p>
                <p className="text-sm text-scale-1000 mb-2">
                  This copy might need to change, when adding a new payment method, either remove
                  the old one or go to your projects' subscription to explicitly update the payment
                  method.
                </p>
              </div>
            </div>
          </FormSectionLabel>
        }
      >
        <FormSectionContent loading={isLoading}>
          {!canReadPaymentMethods ? (
            <NoPermission resourceText="view this organization's payment methods" />
          ) : (
            <FormPanel
              footer={
                <div className="flex items-center justify-between py-4 px-8">
                  {!canUpdatePaymentMethods ? (
                    <p className="text-sm text-scale-1000">
                      You need additional permissions to manage payment methods
                    </p>
                  ) : (
                    <div />
                  )}
                  <Button
                    type="default"
                    icon={<IconPlus />}
                    disabled={!canUpdatePaymentMethods}
                    onClick={() => setShowAddPaymentMethodModal(true)}
                  >
                    Add new card
                  </Button>
                </div>
              }
            >
              <FormSection>
                <FormSectionContent fullWidth loading={false}>
                  {(paymentMethods?.length ?? 0) === 0 ? (
                    <div className="flex items-center space-x-2 opacity-50">
                      <IconCreditCard />
                      <p className="text-sm">No payment methods</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentMethods?.map((paymentMethod) => {
                        const activePaymentMethod =
                          subscription?.payment_method_id === paymentMethod.id
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
                              <p className="prose text-sm font-mono">
                                **** **** **** {paymentMethod.card.last4}
                              </p>
                              <p className="text-sm tabular-nums">
                                Expires: {paymentMethod.card.exp_month}/
                                {paymentMethod.card.exp_year}
                              </p>
                              {activePaymentMethod && <Badge color="green">Active</Badge>}
                            </div>
                            {canUpdatePaymentMethods ? (
                              <Dropdown
                                size="tiny"
                                align="end"
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
                                  className="hover:border-gray-500 px-1"
                                />
                              </Dropdown>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          )}
        </FormSectionContent>
      </FormSection>

      <AddNewPaymentMethodModal
        visible={showAddPaymentMethodModal}
        returnUrl={`${getURL()}/org/${slug}/billing`}
        onCancel={() => setShowAddPaymentMethodModal(false)}
        onConfirm={async () => {
          setShowAddPaymentMethodModal(false)
          ui.setNotification({
            category: 'success',
            message: 'Successfully added new payment method',
          })
          await queryClient.invalidateQueries(organizationKeys.paymentMethods(slug))
        }}
      />

      <DeletePaymentMethodModal
        selectedPaymentMethod={selectedMethodToDelete}
        onClose={() => setSelectedMethodToDelete(undefined)}
      />
    </>
  )
}

export default PaymentMethods
