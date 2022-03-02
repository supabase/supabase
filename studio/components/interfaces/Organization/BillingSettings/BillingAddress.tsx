import { FC } from 'react'
import { Dictionary } from '@supabase/grid'
import { Input, Button } from '@supabase/ui'
import Panel from 'components/to-be-cleaned/Panel'

interface Props {
  loading: boolean
  address: Dictionary<any>
  redirectToPortal: (url: string) => void
}

const BillingAddress: FC<Props> = ({ loading, address, redirectToPortal }) => {
  const { city, country, line1, line2, postal_code, state } = address
  return (
    <div className="space-y-2">
      <div>
        <h4>Billing address</h4>
        <p className="text-sm opacity-50">This will be reflected in every invoice</p>
      </div>
      <Panel
        loading={loading}
        footer={
          <div>
            <Button type="default" onClick={() => redirectToPortal('/customer/update')}>
              Edit billing address
            </Button>
          </div>
        }
      >
        <Panel.Content className="w-3/5 space-y-2">
          <Input readOnly placeholder="Address line 1" value={line1 || ''} />
          <Input readOnly placeholder="Address line 2" value={line2 || ''} />
          <div className="flex items-center space-x-2">
            <Input className="w-full" placeholder="Country" readOnly value={country || ''} />
            <Input
              className="w-full"
              placeholder="Postal code"
              readOnly
              value={postal_code || ''}
            />
          </div>
          {city && <Input readOnly placeholder="City" value={city} />}
        </Panel.Content>
      </Panel>
    </div>
  )
}

export default BillingAddress
