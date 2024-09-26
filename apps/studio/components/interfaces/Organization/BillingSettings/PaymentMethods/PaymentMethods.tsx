import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import AddNewPaymentMethodModal from 'components/interfaces/Billing/Payment/AddNewPaymentMethodModal'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent } from 'components/ui/Forms/FormSection'
import NoPermission from 'components/ui/NoPermission'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrganizationPaymentMethodsQuery } from 'data/organizations/organization-payment-methods-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { getURL } from 'lib/helpers'
import { CreditCardIcon, Plus } from 'lucide-react'
import { Alert, Button } from 'ui'
import ChangePaymentMethodModal from './ChangePaymentMethodModal'
import CreditCard from './CreditCard'
import DeletePaymentMethodModal from './DeletePaymentMethodModal'

const PaymentMethods = () => {
  const { slug } = useParams()
  const selectedOrganization = useSelectedOrganization()
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
            <p className="text-foreground text-base m-0">Payment Methods</p>
            <p className="text-sm text-foreground-light mb-2 pr-4 m-0">
              Payments for your subscription are made using the default card.
            </p>
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {selectedOrganization?.managed_by !== undefined &&
          selectedOrganization?.managed_by !== 'supabase' ? (
            <PartnerManagedResource
              partner={selectedOrganization?.managed_by}
              resource="Payment Methods"
              cta={{
                installationId: selectedOrganization?.partner_id,
              }}
            />
          ) : !canReadPaymentMethods ? (
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
                          icon={<Plus />}
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
                        {(paymentMethods?.data?.length ?? 0) === 0 ? (
                          <div className="flex items-center gap-2 opacity-50">
                            <CreditCardIcon size={16} strokeWidth={1.5} />
                            <p className="text-sm">No payment methods</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {paymentMethods?.data?.map((paymentMethod) => (
                              <CreditCard
                                key={paymentMethod.id}
                                paymentMethod={paymentMethod}
                                canUpdatePaymentMethods={canUpdatePaymentMethods}
                                paymentMethodType={subscription?.payment_method_type}
                                setSelectedMethodForUse={setSelectedMethodForUse}
                                setSelectedMethodToDelete={setSelectedMethodToDelete}
                              />
                            ))}
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
        onConfirm={() => {
          setShowAddPaymentMethodModal(false)
          toast.success('Successfully added new payment method')
        }}
        showSetDefaultCheckbox={true}
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
