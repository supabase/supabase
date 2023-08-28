import HCaptcha from '@hcaptcha/react-hcaptcha'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useTheme } from 'common'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'

import { NewOrgForm } from 'components/interfaces/Organization'
import { WizardLayout } from 'components/layouts'
import { useSetupIntent } from 'data/stripe/setup-intent-mutation'
import { useFlag } from 'hooks'
import { STRIPE_PUBLIC_KEY } from 'lib/constants'
import { useIsHCaptchaLoaded } from 'stores/hcaptcha-loaded-store'
import { NextPageWithLayout } from 'types'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

/**
 * No org selected yet, create a new one
 */
const Wizard: NextPageWithLayout = () => {
  const router = useRouter()
  const { isDarkMode } = useTheme()

  const [intent, setIntent] = useState<any>()
  const captchaLoaded = useIsHCaptchaLoaded()

  const orgCreationV2 = useFlag('orgcreationv2')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRef, setCaptchaRef] = useState<HCaptcha | null>(null)

  const { mutate: setupIntent } = useSetupIntent({ onSuccess: (res) => setIntent(res) })

  const captchaRefCallback = useCallback((node) => {
    setCaptchaRef(node)
  }, [])

  useEffect(() => {
    if (orgCreationV2 === false) {
      router.push('/new')
    }
  }, [orgCreationV2])

  const initSetupIntent = async (hcaptchaToken: string | undefined) => {
    if (!hcaptchaToken) return console.error('Hcaptcha token is required')

    // Force a reload of Elements, necessary for Stripe
    setIntent(undefined)
    setupIntent({ hcaptchaToken })
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

      await initSetupIntent(token ?? undefined)
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
