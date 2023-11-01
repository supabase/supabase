import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { FormPanel, FormSection, FormSectionContent } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { organizationKeys } from 'data/organizations/keys'
import { useOrganizationPaymentMethodsQuery } from 'data/organizations/organization-payment-methods-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions, useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { getURL } from 'lib/helpers'
import Link from 'next/link'
import {
  Alert,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconCreditCard,
  IconMoreHorizontal,
  IconPlus,
} from 'ui'
import ChangePaymentMethodModal from './ChangePaymentMethodModal'
import DeletePaymentMethodModal from './DeletePaymentMethodModal'
import AddNewPaymentMethodModal from 'components/interfaces/Billing/Payment/AddNewPaymentMethodModal'

const PaymentMethods = () => {
  const { ui } = useStore()
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const [selectedMethodForUse, setSelectedMethodForUse] = useState<any>()
  const [selectedMethodToDelete, setSelectedMethodToDelete] = useState<any>()
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false)

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: slug })
  const {
    data: paymentMethods,
    error,
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
      <ScaffoldSection>
        <ScaffoldSectionDetail>
          <div className="sticky space-y-2 top-12">
            <p className="text-base m-0">Payment methods</p>
            <p className="text-sm text-foreground-light mb-2 pr-4 m-0">
              After adding a payment method, make sure to mark it as active to use it for billing.
              You can remove unused cards.
            </p>
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {!canReadPaymentMethods ? (
            <NoPermission resourceText="view this organization's payment methods" />
          ) : (
            <>
              {isLoading && (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              )}

              {isError && (
                <AlertError subject="Failed to retrieve payment methods" error={error as any} />
              )}

              {isSuccess && (
                <>
                  {subscription?.payment_method_type === 'invoice' && (
                    <Alert
                      withIcon
                      variant="info"
                      title="Payment is currently by invoice"
                      actions={[
                        <Button key="payment-method-support" asChild type="default">
                          <Link
                            href={`/support/new?category=billing&subject=Request%20to%20change%20payment%20method`}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-3"
                          >
                            Contact support
                          </Link>
                        </Button>,
                      ]}
                    >
                      You get a monthly invoice and payment link via email. To change your payment
                      method, please contact us via our support form.
                    </Alert>
                  )}
                  <FormPanel
                    footer={
                      <div className="flex items-center justify-between py-4 px-8">
                        {!canUpdatePaymentMethods ? (
                          <p className="text-sm text-foreground-light">
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
                              const isActive = subscription?.payment_method_id === paymentMethod.id
                              return (
                                <div
                                  key={paymentMethod.id}
                                  className="flex items-center justify-between"
                                >
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
                                  </div>
                                  {isActive && <Badge color="green">Active</Badge>}
                                  {canUpdatePaymentMethods && !isActive ? (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger>
                                        <Button
                                          asChild
                                          type="outline"
                                          icon={<IconMoreHorizontal />}
                                          className="hover:border-gray-500 px-1"
                                        >
                                          <span />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        {subscription?.plan.id !== 'free' &&
                                          subscription?.payment_method_type === 'card' && (
                                            <>
                                              <DropdownMenuItem
                                                key="make-default"
                                                onClick={() =>
                                                  setSelectedMethodForUse(paymentMethod)
                                                }
                                              >
                                                <p>Use this card</p>
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                            </>
                                          )}
                                        <DropdownMenuItem
                                          key="delete-method"
                                          onClick={() => setSelectedMethodToDelete(paymentMethod)}
                                        >
                                          <p>Delete card</p>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </FormSectionContent>
                    </FormSection>
                  </FormPanel>
                </>
              )}
            </>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>

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

      <ChangePaymentMethodModal
        selectedPaymentMethod={selectedMethodForUse}
        onClose={() => setSelectedMethodForUse(undefined)}
      />

      <DeletePaymentMethodModal
        selectedPaymentMethod={selectedMethodToDelete}
        onClose={() => setSelectedMethodToDelete(undefined)}
      />
    </>
  )
}

export default PaymentMethods
