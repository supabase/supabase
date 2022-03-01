import { FC } from 'react'
import { Input, Button, IconLoader } from '@supabase/ui'
import Panel from 'components/to-be-cleaned/Panel'

interface Props {
  loading: boolean
  taxIds: any[]
  redirectToPortal: (url: string) => void
}

const TaxID: FC<Props> = ({ loading, taxIds, redirectToPortal }) => {
  return (
    <div className="space-y-2">
      <div>
        <h4>Tax ID</h4>
        <p className="text-sm opacity-50">
          If you would like to include specific tax ID(s) to your invoices
        </p>
      </div>
      <Panel
        loading={loading}
        footer={
          <div>
            <Button type="default" onClick={() => redirectToPortal('/customer/update')}>
              Edit Tax IDs
            </Button>
          </div>
        }
      >
        <Panel.Content className="w-3/5">
          {loading && taxIds.length === 0 ? (
            <div className="flex items-center space-x-4">
              <IconLoader className="animate-spin" size={14} />
              <p className="text-sm">Retrieving tax information</p>
            </div>
          ) : taxIds.length >= 1 ? (
            <div className="w-full space-y-2">
              {taxIds.map((taxId: any) => {
                const taxIdType = taxId.type.replace('_', ' ').toUpperCase()
                return (
                  <div key={taxId.id} className="flex items-center space-x-6">
                    <p>{taxIdType}</p>
                    <Input readOnly value={taxId.value} />
                  </div>
                )
              })}
            </div>
          ) : (
            <div>
              <p className="flex items-center space-x-2 text-sm text-scale-900">No tax IDs</p>
            </div>
          )}
        </Panel.Content>
      </Panel>
    </div>
  )
}

export default TaxID
