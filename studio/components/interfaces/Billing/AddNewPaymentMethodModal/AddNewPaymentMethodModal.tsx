import HCaptcha from '@hcaptcha/react-hcaptcha'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { FC, useCallback, useEffect, useState } from 'react'

import { Modal } from 'ui'
import { useStore } from 'hooks'
import { useIsHCaptchaLoaded } from 'stores/hcaptcha-loaded-store'
import { post } from 'lib/common/fetch'
import { API_URL, STRIPE_PUBLIC_KEY } from 'lib/constants'
import AddPaymentMethodForm from './AddPaymentMethodForm'

interface Props {
  visible: boolean
  returnUrl: string
  onCancel: () => void
}

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

const AddNewPaymentMethodModal: FC<Props> = ({ visible, returnUrl, onCancel }) => {
  const { ui } = useStore()
  const [intent, setIntent] = useState<any>()

  const captchaLoaded = useIsHCaptchaLoaded()

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRef, setCaptchaRef] = useState<HCaptcha | null>(null)

  const captchaRefCallback = useCallback((node) => {
    setCaptchaRef(node)
  }, [])

  useEffect(() => {
    const loadPaymentForm = async () => {
      if (visible && captchaRef && captchaLoaded) {
        let token = captchaToken

        try {
          if (!token) {
            const captchaResponse = await captchaRef.execute({ async: true })
            token = captchaResponse?.response ?? null
          }
        } catch (error) {
          return
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
    // We cant display the hCaptcha in the modal, as the modal auto-closes when clicking the captcha
    // So we only show the modal if the captcha has been executed successfully (intent loaded)
    <>
      <HCaptcha
        ref={captchaRefCallback}
        sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
        size="invisible"
        onVerify={(token) => {
          setCaptchaToken(token)
        }}
        onClose={onLocalCancel}
        onExpire={() => {
          setCaptchaToken(null)
        }}
      />

      <Modal
        hideFooter
        size="medium"
        visible={visible && intent !== undefined}
        header="Add new payment method"
        onCancel={onLocalCancel}
        className="PAYMENT"
      >
        <div className="py-4 space-y-4">
          <Elements stripe={stripePromise} options={options}>
            <AddPaymentMethodForm returnUrl={returnUrl} onCancel={onLocalCancel} />
          </Elements>
        </div>
      </Modal>
    </>
  )
}

export default AddNewPaymentMethodModal
