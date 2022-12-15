import { FC, useEffect, useRef, useState } from 'react'
import { IconLoader, Modal } from 'ui'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, STRIPE_PUBLIC_KEY } from 'lib/constants'
import AddPaymentMethodForm from './AddPaymentMethodForm'
import HCaptcha from '@hcaptcha/react-hcaptcha'

interface Props {
  visible: boolean
  returnUrl: string
  onCancel: () => void
}

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

const AddNewPaymentMethodModal: FC<Props> = ({ visible, returnUrl, onCancel }) => {
  const { ui } = useStore()
  const [intent, setIntent] = useState<any>()

  const [captchaLoaded, setCaptchaLoaded] = useState(false)

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  useEffect(() => {
    const loadPaymentForm = async () => {
      if (visible && captchaLoaded) {
        let token = captchaToken
        if (!token) {
          const captchaResponse = await captchaRef.current?.execute({ async: true })
          token = captchaResponse?.response ?? null
        }

        await setupIntent(token ?? undefined)
      }
    }

    loadPaymentForm()
  }, [visible, captchaLoaded])

  const onCaptchaLoaded = () => {
    setCaptchaLoaded(true)
  }

  const setupIntent = async (hcaptchaToken: string | undefined) => {
    setIntent(undefined)

    const orgSlug = ui.selectedOrganization?.slug ?? ''
    const intent = await post(`${API_URL}/organizations/${orgSlug}/payments/setup-intent`, {
      hcaptchaToken,
    })

    if (intent.error) {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()

      return ui.setNotification({
        category: 'error',
        message: intent.error.message,
        error: intent.error,
      })
    }

    setIntent(intent)
  }

  const options = {
    clientSecret: intent ? intent.client_secret : '',
    appearance: { theme: 'night', labels: 'floating' },
  } as any

  return (
    <Modal
      hideFooter
      size="medium"
      visible={visible}
      header="Add new payment method"
      onCancel={onCancel}
      className="PAYMENT"
    >
      <HCaptcha
        ref={captchaRef}
        sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
        size="invisible"
        onLoad={onCaptchaLoaded}
        onVerify={(token) => {
          setCaptchaToken(token)
        }}
        onExpire={() => {
          setCaptchaToken(null)
        }}
      />
      <div className="space-y-4 py-4">
        {intent !== undefined ? (
          <Elements stripe={stripePromise} options={options}>
            <AddPaymentMethodForm returnUrl={returnUrl} onCancel={onCancel} />
          </Elements>
        ) : (
          <div className="flex w-full items-center justify-center py-20">
            <IconLoader size={16} className="animate-spin" />
          </div>
        )}
      </div>
    </Modal>
  )
}

export default AddNewPaymentMethodModal
