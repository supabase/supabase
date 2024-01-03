import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import { Button_Shadcn_, Input_Shadcn_ } from 'ui'
import { auth } from '~/lib/userAuth'

export function getServerSideProps() {
  if (process.env.NEXT_PUBLIC_DEV_AUTH_PAGE === 'true') {
    return {
      props: {},
    }
  }
  return {
    notFound: true,
  }
}

export default function DevOnlySecretAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  function signInWithGitHub() {
    auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo:
          process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
            ? location.origin
            : process.env.NEXT_PUBLIC_SITE_URL,
      },
    })
  }

  async function signInWithSSO() {
    if (!email) {
      console.error('Email is required to sign in with SSO')
      return
    }

    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    const { data, error } = await auth.signInWithSSO({
      domain: email.split('@')[1],
      options: {
        captchaToken: token ?? undefined,
        redirectTo: `${
          process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
            ? location.origin
            : process.env.NEXT_PUBLIC_SITE_URL
        }${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/sign-in-mfa`,
      },
    })

    if (!error) {
      await queryClient.resetQueries()

      if (data) {
        // redirect to SSO identity provider page
        window.location.href = data.url
      }
    } else {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()

      console.error('Error signing in with SSO', error)
    }
  }

  function signOut() {
    auth.signOut().then(({ error }) => {
      if (error) {
        throw error
      }

      router.push('/')
    })
  }

  return (
    <div className="p-10 flex items-center justify-center">
      <section className="space-y-4">
        <h1>Sign in</h1>
        <p>
          This is a dev and staging-only route to sign in and test authenticated actions within
          docs. In production, signin is managed via dashboard because docs and dashboard are on the
          same domain.
        </p>
        <form className="flex flex-col gap-2 max-w-sm">
          <Input_Shadcn_
            type="email"
            placeholder="Email for SSO signin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <HCaptcha
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            size="invisible"
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => {
              setCaptchaToken(null)
            }}
          />
          <Button_Shadcn_ type="button" onClick={() => signInWithSSO()}>
            {' '}
            Sign in with SSO
          </Button_Shadcn_>
          <Button_Shadcn_ type="button" onClick={() => signInWithGitHub()}>
            {' '}
            Sign in with GitHub
          </Button_Shadcn_>
          <Button_Shadcn_ type="button" onClick={signOut}>
            Sign out
          </Button_Shadcn_>
        </form>
      </section>
    </div>
  )
}
