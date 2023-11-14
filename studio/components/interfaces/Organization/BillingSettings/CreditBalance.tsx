import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { Badge } from 'ui'

const CreditBalance = () => {
  const { slug } = useParams()
  const { data, error, isLoading, isError, isSuccess } = useOrganizationCustomerProfileQuery({
    slug,
  })

  const customerBalance = (data?.balance ?? 0) / 100
  const isCredit = customerBalance < 0
  const isDebt = customerBalance > 0
  const balance =
    isCredit && customerBalance !== 0
      ? customerBalance.toFixed(2).toString().replace('-', '')
      : customerBalance.toFixed(2)

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12">
          <div className="flex items-center space-x-2">
            <p className="text-base m-0">Credit balance</p>
            {isCredit && <Badge>You have credits available</Badge>}
            {isDebt && <Badge color="red">Outstanding payments</Badge>}
          </div>
          <p className="text-sm text-foreground-light m-0">
            Charges will be deducted from your balance first
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {isLoading && (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        )}

        {isError && (
          <AlertError subject="Failed to retrieve organization customer profile" error={error} />
        )}

        {isSuccess && (
          <div className="flex items-end space-x-1">
            {isDebt && <h4 className="opacity-50">-</h4>}
            <h4 className="opacity-50">$</h4>
            <h2 className="text-4xl relative top-[2px]">{balance}</h2>
            {isCredit && <h4 className="opacity-50">/credits</h4>}
          </div>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default CreditBalance
