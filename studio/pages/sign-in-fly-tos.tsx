import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from 'ui'
import { useTheme } from 'next-themes'
import { API_URL } from 'lib/constants'

const SignInFlyTos = () => {
  const router = useRouter()
  const {
    isReady,
    query: { extension_id, organization_id },
  } = router
  const { resolvedTheme } = useTheme()

  const onSignInWithFly = async () => {
    window.location.href = extension_id
      ? `${API_URL}/tos/fly?extension_id=${extension_id}`
      : `${API_URL}/tos/fly?organization_id=${organization_id}`
  }

  return (
    <div className="relative mx-auto flex flex-1 w-full flex-col items-center justify-center space-y-6">
      <div className="absolute top-0 mx-auto w-full max-w-7xl px-8 pt-6 sm:px-6 lg:px-8">
        <nav className="relative flex items-center justify-between sm:h-10">
          <div className="flex flex-shrink-0 flex-grow items-center lg:flex-grow-0">
            <div className="flex w-full items-center justify-between md:w-auto">
              <Link href="/projects">
                <div>
                  <Image
                    src={
                      resolvedTheme === 'dark'
                        ? `${router.basePath}/img/supabase-dark.svg`
                        : `${router.basePath}/img/supabase-light.svg`
                    }
                    alt=""
                    height={24}
                    width={120}
                  />
                </div>
              </Link>
            </div>
          </div>
        </nav>
      </div>
      <div className="flex w-[320px] flex-col items-center justify-center space-y-3">
        <h4 className="text-lg">Continue to Supabase Dashboard</h4>
      </div>
      <div className="flex flex-col items-center space-x-4 space-y-4">
        <Button onClick={onSignInWithFly} disabled={!extension_id && !organization_id}>
          Login with Fly.io
        </Button>
        {isReady && !extension_id && !organization_id && (
          <p className="text-red-900 text-sm">
            An extension ID or organization ID is required to login
          </p>
        )}
      </div>
      <div className="sm:text-center">
        <p className="text-xs text-foreground-lighter sm:mx-auto sm:max-w-sm">
          By continuing, you agree to Supabase's{' '}
          <Link href="https://supabase.com/terms" className="underline hover:text-foreground-light">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="https://supabase.com/privacy"
            className="underline hover:text-foreground-light"
          >
            Privacy Policy
          </Link>
          , and to receive periodic emails with updates.
        </p>
      </div>
    </div>
  )
}

export default SignInFlyTos
