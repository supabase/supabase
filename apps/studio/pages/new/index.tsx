import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useState } from 'react'

import { NewOrgForm } from 'components/interfaces/Organization'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import WizardLayout from 'components/layouts/WizardLayout'
import { SetupIntentResponse, useSetupIntent } from 'data/stripe/setup-intent-mutation'
import { useIsHCaptchaLoaded } from 'stores/hcaptcha-loaded-store'
import type { NextPageWithLayout } from 'types'

/**
 * No org selected yet, create a new one
 */
const Wizard: NextPageWithLayout = () => {
  const { resolvedTheme } = useTheme()

  const [intent, setIntent] = useState<SetupIntentResponse>()
  const captchaLoaded = useIsHCaptchaLoaded()

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRef, setCaptchaRef] = useState<HCaptcha | null>(null)

  const { mutate: setupIntent } = useSetupIntent({ onSuccess: (res) => setIntent(res) })

  const captchaRefCallback = useCallback((node: any) => {
    setCaptchaRef(node)
  }, [])

  const initSetupIntent = async (hcaptchaToken: string | undefined) => {
    if (!hcaptchaToken) return console.error('Hcaptcha token is required')

    // Force a reload of Elements, necessary for Stripe
    setIntent(undefined)
    setupIntent({ hcaptchaToken })
  }

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

      <NewOrgForm setupIntent={intent} onPaymentMethodReset={() => resetSetupIntent()} />
    </>
  )
}

Wizard.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="New organization">
      <WizardLayout>{page}</WizardLayout>
    </DefaultLayout>
  </AppLayout>
)

export default Wizard
