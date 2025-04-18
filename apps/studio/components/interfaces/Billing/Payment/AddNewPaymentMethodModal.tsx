import HCaptcha from '@hcaptcha/react-hcaptcha'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from 'ui'

import { useOrganizationPaymentMethodSetupIntent } from 'data/organizations/organization-payment-method-setup-intent-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { STRIPE_PUBLIC_KEY } from 'lib/constants'
import { useIsHCaptchaLoaded } from 'stores/hcaptcha-loaded-store'
import AddPaymentMethodForm from './AddPaymentMethodForm'

interface AddNewPaymentMethodModalProps {
  visible: boolean
  returnUrl: string
  onCancel: () => void
  onConfirm: () => void
  showSetDefaultCheckbox?: boolean
  autoMarkAsDefaultPaymentMethod?: boolean
}

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

const AddNewPaymentMethodModal = ({
  visible,
  returnUrl,
  onCancel,
  onConfirm,
  showSetDefaultCheckbox,
  autoMarkAsDefaultPaymentMethod,
}: AddNewPaymentMethodModalProps) => {
  const { resolvedTheme } = useTheme()
  const [intent, setIntent] = useState<any>()
  const selectedOrganization = useSelectedOrganization()

  const captchaLoaded = useIsHCaptchaLoaded()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRef, setCaptchaRef] = useState<HCaptcha | null>(null)

  const { mutate: setupIntent } = useOrganizationPaymentMethodSetupIntent({
    onSuccess: (intent) => {
      setIntent(intent)
    },
    onError: (error) => {
      toast.error(`Failed to setup intent: ${error.message}`)
    },
  })

  const captchaRefCallback = useCallback((node: any) => {
    setCaptchaRef(node)
  }, [])

  useEffect(() => {
    const initSetupIntent = async (hcaptchaToken: string | undefined) => {
      const slug = selectedOrganization?.slug
      if (!slug) return console.error('Slug is required')
      if (!hcaptchaToken) return console.error('HCaptcha token required')

      setIntent(undefined)
      setupIntent({ slug, hcaptchaToken })
    }

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

        await initSetupIntent(token ?? undefined)
        resetCaptcha()
      }
    }

    loadPaymentForm()
  }, [visible, captchaRef, captchaLoaded])

  const resetCaptcha = () => {
    setCaptchaToken(null)
    captchaRef?.resetCaptcha()
  }

  const options = {
    clientSecret: intent ? intent.client_secret : '',
    appearance: { theme: resolvedTheme?.includes('dark') ? 'night' : 'flat', labels: 'floating' },
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
        <Elements stripe={stripePromise} options={options}>
          <AddPaymentMethodForm
            returnUrl={returnUrl}
            onCancel={onLocalCancel}
            onConfirm={onLocalConfirm}
            showSetDefaultCheckbox={showSetDefaultCheckbox}
            autoMarkAsDefaultPaymentMethod={autoMarkAsDefaultPaymentMethod}
          />
        </Elements>
      </Modal>
    </>
  )
}

export default AddNewPaymentMethodModal
