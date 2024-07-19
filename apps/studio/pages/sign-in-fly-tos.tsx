import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useIsLoggedIn } from 'common'
import { useOrganizationByFlyOrgIdMutation } from 'data/organizations/organization-by-fly-organization-id-mutation'
import { useProjectByFlyExtensionIdMutation } from 'data/projects/project-by-fly-extension-id-mutation'
import { API_URL } from 'lib/constants'
import { Button } from 'ui'

const SignInFlyTos = () => {
  const [loading, setLoading] = useState(true)
  const isLoggedIn = useIsLoggedIn()
  const router = useRouter()
  const {
    isReady,
    query: { fly_extension_id, fly_organization_id },
  } = router
  const { resolvedTheme } = useTheme()
  const { mutateAsync: getProjectByFlyExtensionId } = useProjectByFlyExtensionIdMutation({
    onSuccess: (res) => {
      router.replace(`/project/${res.ref}`)
    },
    onError: () => {
      setLoading(false)
    },
  })
  const { mutateAsync: getOrgByFlyOrgId } = useOrganizationByFlyOrgIdMutation({
    onSuccess: () => {
      router.replace('/projects')
    },
    onError: () => {
      setLoading(false)
    },
  })

  useEffect(() => {
    if (!isReady) {
      return
    }
    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    fly_extension_id
      ? getProjectByFlyExtensionId({ flyExtensionId: fly_extension_id as string })
      : fly_organization_id
        ? getOrgByFlyOrgId({ flyOrganizationId: fly_organization_id as string })
        : setLoading(false)
  }, [isReady])

  const [isRedirecting, setIsRedirecting] = useState(false)

  const onSignInWithFly = async () => {
    setIsRedirecting(true)

    try {
      window.location.href = fly_extension_id
        ? `${API_URL}/tos/fly?extension_id=${fly_extension_id}`
        : `${API_URL}/tos/fly?organization_id=${fly_organization_id}`
    } catch (error) {
      setIsRedirecting(false)
      throw error
    }
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
                      resolvedTheme?.includes('dark')
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
      {loading ? (
        <p className="text-sm">Checking your access rights...</p>
      ) : (
        <div className="flex flex-col items-center space-x-4 space-y-4">
          <Button
            onClick={onSignInWithFly}
            disabled={(!fly_extension_id && !fly_organization_id) || isRedirecting}
            loading={isRedirecting}
          >
            Login with Fly.io
          </Button>
          {isReady && !fly_extension_id && !fly_organization_id && (
            <p className="text-red-900 text-sm">
              A fly extension ID or organization ID is required to login
            </p>
          )}
        </div>
      )}
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
