import HCaptcha from '@hcaptcha/react-hcaptcha'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useCallback, useEffect, useState } from 'react'

import { useTheme } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useSelectedOrganization, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, STRIPE_PUBLIC_KEY } from 'lib/constants'
import { useIsHCaptchaLoaded } from 'stores/hcaptcha-loaded-store'
import { Modal } from 'ui'
import AddNewPaymentMethodForm from './AddNewPaymentMethodForm'

// [Joshen] Directly brought over from old Billing folder, so we can deprecate that folder easily next time

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
    <>
      <HCaptcha
        id="supabase-captcha"
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
        visible={visible}
        header="Add new payment method"
        onCancel={() => onLocalCancel()}
        className="PAYMENT"
      >
        <div className="py-4">
          {intent === undefined ? (
            <div className="px-6 space-y-2">
              <ShimmeringLoader className="w-full" />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          ) : (
            <Elements stripe={stripePromise} options={options}>
              <AddNewPaymentMethodForm
                returnUrl={returnUrl}
                onCancel={onLocalCancel}
                onConfirm={onLocalConfirm}
              />
            </Elements>
          )}
        </div>
      </Modal>
    </>
  )
}

export default AddNewPaymentMethodModal
