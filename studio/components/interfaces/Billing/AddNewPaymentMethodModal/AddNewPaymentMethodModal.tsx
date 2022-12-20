import { FC, useCallback, useEffect, useRef, useState } from 'react'
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
  const [captchaRef, setCaptchaRef] = useState<HCaptcha | null>(null)

  const captchaRefCallback = useCallback((node) => {
    setCaptchaRef(node)
  }, [])

  /**
   * We want to load the Stripe payment elements only after successfully verifying captcha.
   * To execute hCaptcha when displaying the modal, we need to ensure hCaptcha is actually loaded.
   * The `onLoad` method from hCaptcha is only executed ONCE for the entire application, so we cannot listen to it.
   * One way to find out if hCaptcha has been initialized, is checking `window.hcaptcha`. When checking via window,
   * we know if the hCaptcha has been initialized from a different part of the app or through this component.
   */
  useEffect(() => {
    setCaptchaLoaded(true)
    // @ts-ignore
  }, [window.hcaptcha])

  useEffect(() => {
    const loadPaymentForm = async () => {
      if (visible && captchaRef && captchaLoaded) {
        let token = captchaToken
        if (!token) {
          const captchaResponse = await captchaRef.execute({ async: true })
          token = captchaResponse?.response ?? null
        }

        await setupIntent(token ?? undefined)
        resetCaptcha()
      }
    }

    loadPaymentForm()
  }, [visible, captchaRef, captchaLoaded])

  const resetCaptcha = () => {
    setCaptchaToken(null)
    captchaRef?.resetCaptcha()
  }

  const setupIntent = async (hcaptchaToken: string | undefined) => {
    setIntent(undefined)

    const orgSlug = ui.selectedOrganization?.slug ?? ''
    const intent = await post(`${API_URL}/organizations/${orgSlug}/payments/setup-intent`, {
      hcaptchaToken,
    })

    if (intent.error) {
      return ui.setNotification({
        category: 'error',
        message: intent.error.message,
        error: intent.error,
      })
    } else {
      setIntent(intent)
    }
  }

  const options = {
    clientSecret: intent ? intent.client_secret : '',
    appearance: { theme: 'night', labels: 'floating' },
  } as any

  const onLocalCancel = () => {
    setIntent(undefined)
    return onCancel()
  }

  return (
    <Modal
      hideFooter
      size="medium"
      visible={visible}
      header="Add new payment method"
      onCancel={onLocalCancel}
      className="PAYMENT"
    >
      <HCaptcha
        ref={captchaRefCallback}
        sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
        size="invisible"
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
            <AddPaymentMethodForm returnUrl={returnUrl} onCancel={onLocalCancel} />
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
