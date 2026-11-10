import HCaptcha from '@hcaptcha/react-hcaptcha'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

import { NewOrgForm } from '@/components/interfaces/Organization/NewOrg/NewOrgForm'
import WizardLayout from '@/components/layouts/WizardLayout'
import { SetupIntentResponse, useSetupIntent } from '@/data/stripe/setup-intent-mutation'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/_app/new/')({
  component: NewOrgRoute,
  staticData: {
    hideMobileMenu: true,
    defaultLayoutHeaderTitle: 'New organization',
  },
})

// Inline WizardLayout here rather than via a `_app/new.tsx` sub-shell:
// `new/$slug.tsx` is not under _app (no AppLayout), and the only other
// potential leaf has a different inner wrapper, so a shared shell would not
// actually share anything.
function NewOrgRoute() {
  return (
    <WizardLayout>
      <Wizard />
    </WizardLayout>
  )
}

/**
 * No org selected yet, create a new one
 */
function Wizard() {
  const [intent, setIntent] = useState<SetupIntentResponse>()
  const { appTitle } = useCustomContent(['app:title'])
  const pageTitle = buildStudioPageTitle({
    section: 'New Organization',
    brand: appTitle || 'Supabase',
  })

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRef, setCaptchaRef] = useState<HCaptcha | null>(null)

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const { mutate: setupIntent } = useSetupIntent({ onSuccess: (res) => setIntent(res) })

  const captchaRefCallback = useCallback((node: HCaptcha) => {
    setCaptchaRef(node)
  }, [])

  const initSetupIntent = async (hcaptchaToken: string | undefined) => {
    if (!hcaptchaToken) return console.error('Hcaptcha token is required')

    // Force a reload of Elements, necessary for Stripe
    // Also mitigates card testing to some extent as we generate a new captcha token
    setIntent(undefined)
    setupIntent({ hcaptchaToken })
  }

  const loadPaymentForm = async (force = false) => {
    if (selectedPlan == null || selectedPlan === 'FREE') return
    if (intent != null && !force) return

    if (captchaRef) {
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
  }, [captchaRef, selectedPlan])

  const resetSetupIntent = () => {
    setIntent(undefined)
    return loadPaymentForm(true)
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
      {/* Wizard layouts set the visual header but not the browser tab title. */}
      <title>{pageTitle}</title>
      <meta name="description" content="Supabase Studio" />
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

      <NewOrgForm
        setupIntent={intent}
        onPaymentMethodReset={() => resetSetupIntent()}
        onPlanSelected={(plan) => setSelectedPlan(plan)}
      />
    </>
  )
}
