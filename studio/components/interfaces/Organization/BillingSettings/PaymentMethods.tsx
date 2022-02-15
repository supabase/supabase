import { FC } from 'react'
import Panel from 'components/to-be-cleaned/Panel'
import {
  IconPlus,
  IconEdit2,
  IconCreditCard,
  Typography,
  Button,
  Input,
  IconLoader,
} from '@supabase/ui'

interface Props {
  loading: boolean
  paymentMethods: any[]
  redirectToPortal: (url: string) => void
}

const PaymentMethods: FC<Props> = ({ loading, paymentMethods, redirectToPortal }) => {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Typography.Title level={4}>Payment methods</Typography.Title>
        <Typography.Text type="secondary">
          Charges will be deducted from the default card
        </Typography.Text>
      </div>
      <Panel
        loading={loading}
        footer={
          <div>
            <Button
              key="panel-footer"
              type="secondary"
              icon={<IconPlus />}
              onClick={() => redirectToPortal('/payment-methods')}
            >
              Add new card
            </Button>
          </div>
        }
      >
        <Panel.Content>
          {loading ? (
            <div className="flex items-center space-x-4">
              <IconLoader className="animate-spin" size={14} />
              <Typography.Text>Retrieving payment methods</Typography.Text>
            </div>
          ) : paymentMethods.length >= 1 ? (
            <div className="space-y-2">
              {paymentMethods.map((paymentMethod: any) => (
                <div key={paymentMethod.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-8">
                    <img
                      src={`/img/payment-methods/${paymentMethod.card.brand
                        .replace(' ', '-')
                        .toLowerCase()}.png`}
                      width="32"
                    />
                    <Input
                      readOnly
                      size="tiny"
                      value={`•••• •••• •••• ${paymentMethod.card.last4}`}
                    />
                    <Typography.Text>
                      {paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}
                    </Typography.Text>
                  </div>
                  <Button type="outline" icon={<IconEdit2 />} onClick={() => redirectToPortal('/')}>
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <Typography.Text type="secondary" className="flex items-center space-x-2">
                <div>
                  <IconCreditCard />
                </div>
                <div>No payment methods</div>
              </Typography.Text>
            </div>
          )}
        </Panel.Content>
      </Panel>
    </div>
  )
}

export default PaymentMethods
