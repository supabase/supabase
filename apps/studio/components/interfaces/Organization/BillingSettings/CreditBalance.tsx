import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent } from 'components/ui/Forms/FormSection'
import NoPermission from 'components/ui/NoPermission'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useFlag } from 'hooks/ui/useFlag'
import { CreditTopUp } from './CreditTopUp'

const CreditBalance = () => {
  const { slug } = useParams()
  const creditTopUpEnabled = useFlag('creditTopUp')

  const canReadSubscriptions = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  const {
    data: subscription,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgSubscriptionQuery({ orgSlug: slug }, { enabled: canReadSubscriptions })

  const customerBalance = (subscription?.customer_balance ?? 0) / 100
  const isCredit = customerBalance < 0
  const isDebt = customerBalance > 0
  const balance =
    isCredit && customerBalance !== 0
      ? customerBalance.toFixed(2).toString().replace('-', '')
      : customerBalance.toFixed(2)

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12 pr-3">
          <div className="flex items-center space-x-2">
            <p className="text-foreground text-base m-0">Credit Balance</p>
          </div>
          <p className="text-sm text-foreground-light m-0">
            Credits will be applied to future invoices, before charging your payment method. If your
            credit balance runs out, your default payment method will be charged.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {!canReadSubscriptions ? (
          <NoPermission resourceText="view this organization's credits" />
        ) : (
          <>
            <FormPanel footer={creditTopUpEnabled ? <CreditTopUp slug={slug} /> : null}>
              <FormSection>
                <FormSectionContent fullWidth loading={isLoading}>
                  {isError && (
                    <AlertError
                      subject="Failed to retrieve organization customer profile"
                      error={error}
                    />
                  )}

                  {isSuccess && (
                    <div className="flex w-full justify-between items-center">
                      <span>Balance</span>
                      <div className="flex items-center space-x-1">
                        {isDebt && <h4 className="opacity-50">-</h4>}
                        <h4 className="opacity-50">$</h4>
                        <h2 className="text-2xl relative">{balance}</h2>
                        {isCredit && <h4 className="opacity-50">/credits</h4>}
                      </div>
                    </div>
                  )}
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          </>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default CreditBalance
