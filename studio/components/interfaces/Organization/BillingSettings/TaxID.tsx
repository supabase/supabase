import { FC } from 'react'
import { Input, Button, Typography, IconLoader } from '@supabase/ui'
import Panel from 'components/to-be-cleaned/Panel'

interface Props {
  loading: boolean
  taxIds: any[]
  redirectToPortal: (url: string) => void
}

const TaxID: FC<Props> = ({ loading, taxIds, redirectToPortal }) => {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Typography.Title level={4}>Tax ID</Typography.Title>
        <Typography.Text type="secondary">
          If you would like to include specific tax ID(s) to your invoices
        </Typography.Text>
      </div>
      <Panel
        loading={loading}
        footer={
          <div>
            <Button type="secondary" onClick={() => redirectToPortal('/customer/update')}>
              Edit Tax IDs
            </Button>
          </div>
        }
      >
        <Panel.Content className="w-3/5">
          {loading && taxIds.length === 0 ? (
            <div className="flex items-center space-x-4">
              <IconLoader className="animate-spin" size={14} />
              <Typography.Text>Retrieving tax information</Typography.Text>
            </div>
          ) : taxIds.length >= 1 ? (
            <div className="w-full space-y-2">
              {taxIds.map((taxId: any) => {
                const taxIdType = taxId.type.replace('_', ' ').toUpperCase()
                return (
                  <div key={taxId.id} className="flex items-center space-x-6">
                    <Typography.Text>{taxIdType}</Typography.Text>
                    <Input readOnly value={taxId.value} />
                  </div>
                )
              })}
            </div>
          ) : (
            <div>
              <Typography.Text type="secondary" className="flex items-center space-x-2">
                <div>No tax IDs</div>
              </Typography.Text>
            </div>
          )}
        </Panel.Content>
      </Panel>
    </div>
  )
}

export default TaxID
