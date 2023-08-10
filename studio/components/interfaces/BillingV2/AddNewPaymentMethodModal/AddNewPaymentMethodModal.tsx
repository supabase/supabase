import HCaptcha from '@hcaptcha/react-hcaptcha'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { FC, useCallback, useEffect, useState } from 'react'

import { useTheme } from 'common'
import { useSelectedOrganization, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, STRIPE_PUBLIC_KEY } from 'lib/constants'
import { useIsHCaptchaLoaded } from 'stores/hcaptcha-loaded-store'
import { Modal } from 'ui'
import AddPaymentMethodForm from './AddPaymentMethodForm'

interface AddNewPaymentMethodModalProps {
  visible: boolean
  returnUrl: string
  onCancel: () => void
  onConfirm: () => void
}

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

const AddNewPaymentMethodModal = ({
  visible,
  returnUrl,
  onCancel,
  onConfirm,
}: AddNewPaymentMethodModalProps) => {
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

  const selectedOrganization = useSelectedOrganization()

  const setupIntent = async (hcaptchaToken: string | undefined) => {
    setIntent(undefined)

    const orgSlug = selectedOrganization?.slug ?? ''
    const intent = await post(`${API_URL}/organizations/${orgSlug}/payments/setup-intent`, {
      hcaptchaToken,
    })

    if (intent.error) {
      return ui.setNotification({
        category: 'error',
        error: intent.error,
        message: `Failed to setup intent: ${intent.error.message}`,
      })
    } else {
      setIntent(intent)
    }
  }

  const { isDarkMode } = useTheme()

  const options = {
    clientSecret: intent ? intent.client_secret : '',
    appearance: { theme: isDarkMode ? 'night' : 'flat', labels: 'floating' },
  } as any

  const onLocalCancel = () => {
    setIntent(undefined)
    return onCancel()
  }

  const onLocalConfirm = () => {
    setIntent(undefined)
    return onConfirm()
  }

  return (
    // We cant display the hCaptcha in the modal, as the modal auto-closes when clicking the captcha
    // So we only show the modal if the captcha has been executed successfully (intent loaded)
    <>
      <HCaptcha
        ref={captchaRefCallback}
        sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
        size="invisible"
        onOpen={() => {
          // [Joshen] This is to ensure that hCaptcha popup remains clickable
          if (document !== undefined) document.body.classList.add('!pointer-events-auto')
        }}
        onClose={() => {
          onLocalCancel()
          if (document !== undefined) document.body.classList.remove('!pointer-events-auto')
        }}
        onVerify={(token) => {
          setCaptchaToken(token)
          if (document !== undefined) document.body.classList.remove('!pointer-events-auto')
        }}
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
            <AddPaymentMethodForm
              returnUrl={returnUrl}
              onCancel={onLocalCancel}
              onConfirm={onLocalConfirm}
            />
          </Elements>
        </div>
      </Modal>
    </>
  )
}

export default AddNewPaymentMethodModal
