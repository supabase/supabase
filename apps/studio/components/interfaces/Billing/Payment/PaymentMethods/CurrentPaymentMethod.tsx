import { PermissionAction, SupportCategories } from '@supabase/shared-types/out/constants'
import { CreditCardIcon } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { useOrganizationPaymentMethodsQuery } from 'data/organizations/organization-payment-methods-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Button } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import CreditCard from './CreditCard'

const CurrentPaymentMethod = () => {
  const { slug } = useParams()

  const {
    data: subscription,
    isPending: isLoadingSubscription,
    isError: isErrorSubscription,
  } = useOrgSubscriptionQuery({
    orgSlug: slug,
  })
  const {
    data: paymentMethods,
    isPending: isLoadingOrganizationPaymentMethods,
    isError: isErrorOrganizationPaymentMethods,
  } = useOrganizationPaymentMethodsQuery({ slug })

  const isLoading = isLoadingSubscription || isLoadingOrganizationPaymentMethods
  const isError = isErrorSubscription || isErrorOrganizationPaymentMethods

  const defaultPaymentMethod = paymentMethods?.data.find((pm) => pm.is_default)

  const { can: canReadPaymentMethods } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.payment_methods'
  )

  // since this component is an enhancement,
  // if it can't read payment methods, we will just not show it
  if (!canReadPaymentMethods || isError) return null

  return (
    <div className="flex justify-between items-center gap-4 w-full text-sm rounded-lg p-4 text-foreground bg-alternative border">
      {isLoading ? (
        <ShimmeringLoader className="flex-1" />
      ) : subscription?.payment_method_type === 'invoice' ? (
        <p className="flex-1 text-sm">
          You get a monthly invoice and payment link via email. To change your payment method,
          please contact us via our support form.
        </p>
      ) : !defaultPaymentMethod ? (
        <div className="flex-1 flex items-center gap-2 opacity-50">
          <CreditCardIcon size={16} strokeWidth={1.5} />
          <p className="text-sm">No payment methods</p>
        </div>
      ) : (
        <CreditCard
          paymentMethod={defaultPaymentMethod}
          paymentMethodType={subscription?.payment_method_type}
          canUpdatePaymentMethods={false}
          paymentMethodCount={paymentMethods?.data.length ?? 0}
          subscriptionPlan={subscription?.plan.id}
        />
      )}

      <Button type="outline" asChild>
        {subscription?.payment_method_type === 'invoice' ? (
          <SupportLink
            queryParams={{
              category: SupportCategories.BILLING,
              message: 'I would like to change my payment method',
            }}
          >
            Contact support
          </SupportLink>
        ) : (
          <Link href={`/org/${slug}/billing#payment-methods`}>Manage payment methods</Link>
        )}
      </Button>
    </div>
  )
}

export default CurrentPaymentMethod
