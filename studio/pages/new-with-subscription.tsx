import { useCallback, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { API_URL, STRIPE_PUBLIC_KEY } from 'lib/constants'
import { useFlag, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { WizardLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useIsHCaptchaLoaded } from 'stores/hcaptcha-loaded-store'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { NewOrgForm } from 'components/interfaces/Organization'
import { useTheme } from 'common'
import { useRouter } from 'next/router'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

/**
 * No org selected yet, create a new one
 */
const Wizard: NextPageWithLayout = () => {
  const { ui } = useStore()
  const router = useRouter()

  const [intent, setIntent] = useState<any>()
  const captchaLoaded = useIsHCaptchaLoaded()

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRef, setCaptchaRef] = useState<HCaptcha | null>(null)

  const orgCreationV2 = useFlag('orgcreationv2')

  const { isDarkMode } = useTheme()

  const captchaRefCallback = useCallback((node) => {
    setCaptchaRef(node)
  }, [])

  useEffect(() => {
    if (orgCreationV2 === false) {
      router.push('/new')
    }
  }, [orgCreationV2])

  const setupIntent = async (hcaptchaToken: string | undefined) => {
    // Force a reload of Elements, necessary for Stripe
    setIntent(undefined)

    const intent = await post(`${API_URL}/stripe/setup-intent`, {
      hcaptchaToken,
    })

    if (intent.error) {
      return ui.setNotification({
        category: 'error',
        message: intent.error.message,
        error: `Failed to retrieve intent: ${intent.error}`,
      })
    } else {
      setIntent(intent)
    }
  }

  const options = {
    clientSecret: intent ? intent.client_secret : '',
    appearance: { theme: isDarkMode ? 'night' : 'flat', labels: 'floating' },
  } as any

  const loadPaymentForm = async () => {
    if (captchaRef && captchaLoaded) {
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

  useEffect(() => {
    loadPaymentForm()
  }, [captchaRef, captchaLoaded])

  const resetSetupIntent = () => {
    return loadPaymentForm()
  }

  const onLocalCancel = () => {
    setIntent(undefined)
  }

  const resetCaptcha = () => {
    setCaptchaToken(null)
    captchaRef?.resetCaptcha()
  }

  return (
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

      {intent && (
        <Elements stripe={stripePromise} options={options}>
          <NewOrgForm onPaymentMethodReset={() => resetSetupIntent()} />
        </Elements>
      )}
    </>
  )
}

Wizard.getLayout = (page) => (
  <WizardLayout organization={null} project={null}>
    {page}
  </WizardLayout>
)

export default observer(Wizard)
