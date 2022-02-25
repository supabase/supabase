import { FC } from 'react'
import Panel from 'components/to-be-cleaned/Panel'
import { IconPlus, IconEdit2, IconCreditCard, Button, Input, IconLoader } from '@supabase/ui'

interface Props {
  loading: boolean
  paymentMethods: any[]
  redirectToPortal: (url: string) => void
}

const PaymentMethods: FC<Props> = ({ loading, paymentMethods, redirectToPortal }) => {
  return (
    <div className="space-y-2">
      <div>
        <h4>Payment methods</h4>
        <p className="text-sm opacity-50">Charges will be deducted from the default card</p>
      </div>
      <Panel
        loading={loading}
        footer={
          <div>
            <Button
              key="panel-footer"
              type="default"
              icon={<IconPlus />}
              onClick={() => redirectToPortal('/payment-methods')}
            >
              Add new card
            </Button>
          </div>
        }
      >
        <Panel.Content>
          {loading && paymentMethods.length === 0 ? (
            <div className="flex items-center space-x-4">
              <IconLoader className="animate-spin" size={14} />
              <p className="text-sm">Retrieving payment methods</p>
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
                      size="small"
                      value={`•••• •••• •••• ${paymentMethod.card.last4}`}
                    />
                    <p>
                      {paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}
                    </p>
                  </div>
                  <Button type="outline" icon={<IconEdit2 />} onClick={() => redirectToPortal('/')}>
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p className="flex items-center space-x-2 opacity-50">
                <div>
                  <IconCreditCard />
                </div>
                <div>No payment methods</div>
              </p>
            </div>
          )}
        </Panel.Content>
      </Panel>
    </div>
  )
}

export default PaymentMethods
