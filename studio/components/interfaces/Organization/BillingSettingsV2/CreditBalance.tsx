import { useParams } from 'common'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { Badge } from 'ui'

const CreditBalance = () => {
  const { slug } = useParams()
  const { data } = useOrganizationCustomerProfileQuery({ slug })

  const customerBalance = (data?.balance ?? 0) / 100
  const isCredit = customerBalance < 0
  const isDebt = customerBalance > 0
  const balance =
    isCredit && customerBalance !== 0
      ? customerBalance.toFixed(2).toString().replace('-', '')
      : customerBalance.toFixed(2)

  return (
    <FormSection
      id="credit-balance"
      header={
        <FormSectionLabel>
          <div className="sticky top-16">
            <div className="flex items-center space-x-2">
              <p className="text-base">Credit balance</p>
              {isCredit && <Badge>You have credits available</Badge>}
              {isDebt && <Badge color="red">Outstanding payments</Badge>}
            </div>
            <p className="text-sm text-scale-1000">
              Charges will be deducted from your balance first
            </p>
          </div>
        </FormSectionLabel>
      }
    >
      <FormSectionContent loading={false}>
        <div className="flex items-end space-x-1">
          {isDebt && <h4 className="opacity-50">-</h4>}
          <h4 className="opacity-50">$</h4>
          <h2 className="text-4xl relative top-[2px]">{balance}</h2>
          {isCredit && <h4 className="opacity-50">/credits</h4>}
        </div>
      </FormSectionContent>
    </FormSection>
  )
}

export default CreditBalance
