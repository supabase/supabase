import { InlineLink } from 'components/ui/InlineLink'
import { auth } from 'lib/gotrue'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export const SignInPartner = () => {
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      const params = new URLSearchParams(window.location.hash.substring(1))

      const partner = params.get('partner')
      const token = params.get('id_token')

      const { data } = await auth.getSession()

      if (!data.session && partner && token) {
        try {
          await auth.signInWithIdToken({ provider: partner, token })
        } finally {
          router.replace({ pathname: '/sign-in-mfa' })
        }
      } else {
        router.replace({ pathname: '/sign-in' })
      }
    })()
  }, [])

  return (
    <div className="relative mx-auto w-full flex flex-col items-center justify-center gap-y-6">
      <Loader2 className="animate-spin" />
      <h2 className="text-lg text-center">Signing in to Supabase Dashboard</h2>
      <p className="text-xs text-foreground-lighter text-center max-w-[220px] sm:max-w-full">
        By continuing, you agree to Supabase's{' '}
        <InlineLink
          href="https://supabase.com/terms"
          className="text-foreground-lighter hover:text-foreground"
        >
          Terms of Service
        </InlineLink>{' '}
        and{' '}
        <InlineLink
          href="https://supabase.com/privacy"
          className="text-foreground-lighter hover:text-foreground"
        >
          Privacy Policy
        </InlineLink>
        .
      </p>
    </div>
  )
}
