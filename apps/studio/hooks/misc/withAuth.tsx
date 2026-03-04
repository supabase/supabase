import { useAuth } from 'common'
import { SessionTimeoutModal } from 'components/interfaces/SignIn/SessionTimeoutModal'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useAuthenticatorAssuranceLevelQuery } from 'data/profile/mfa-authenticator-assurance-level-query'
import { useSignOut } from 'lib/auth'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { useRouter } from 'next/router'
import { ComponentType, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { isNextPageWithLayout, type NextPageWithLayout } from 'types'

const MAX_TIMEOUT = 10000 // 10 seconds

export function withAuth<T>(
  WrappedComponent: ComponentType<T> | NextPageWithLayout<T, T>,
  options: {
    /**
     * The auth level used to check the user credentials. In most cases, if the user has MFA enabled
     * we want the highest level (which is 2) for all pages. For certain pages, the user should be
     * able to access them even if he didn't finished his login (typed in his MFA code), for example
     * the support page: We want the user to be able to submit a ticket even if he's not fully
     * signed in.
     * @default true
     */
    useHighestAAL: boolean
  } = { useHighestAAL: true }
) {
  // ignore auth in self-hosted
  if (!IS_PLATFORM) {
    return WrappedComponent
  }

  const WithAuthHOC: ComponentType<T> = (props) => {
    const router = useRouter()
    const signOut = useSignOut()
    const { isLoading, session } = useAuth()

    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
    const [isSessionTimeoutModalOpen, setIsSessionTimeoutModalOpen] = useState(false)

    const {
      isPending: isAALLoading,
      data: aalData,
      isError: isErrorAAL,
      error: errorAAL,
    } = useAuthenticatorAssuranceLevelQuery()

    useEffect(() => {
      if (isErrorAAL) {
        toast.error(
          `Failed to fetch authenticator assurance level: ${errorAAL?.message}. Try refreshing your browser, or reach out to us via a support ticket if the issue persists`
        )
      }
    }, [isErrorAAL, errorAAL])

    const { isError: isErrorPermissions, error: errorPermissions } = usePermissionsQuery()

    useEffect(() => {
      if (isErrorPermissions) {
        toast.error(
          `Failed to fetch permissions: ${errorPermissions?.message}. Try refreshing your browser, or reach out to us via a support ticket if the issue persists`
        )
      }
    }, [isErrorPermissions, errorPermissions])

    const isLoggedIn = Boolean(session)
    const isFinishedLoading = !isLoading && !isAALLoading

    const redirectToSignIn = useCallback(() => {
      let pathname = location.pathname
      if (BASE_PATH) {
        pathname = pathname.replace(BASE_PATH, '')
      }

      if (pathname === '/sign-in') {
        // If the user is already on the sign in page, we don't need to redirect them
        return
      }

      const searchParams = new URLSearchParams(location.search)
      searchParams.set('returnTo', pathname)

      // Sign out before redirecting to sign in page incase the user is stuck in a loading state
      signOut().finally(() => {
        router.push(`/sign-in?${searchParams.toString()}`)
      })
    }, [router, signOut])

    useEffect(() => {
      if (!isFinishedLoading) {
        timeoutIdRef.current = setTimeout(() => {
          setIsSessionTimeoutModalOpen(true)
        }, MAX_TIMEOUT)
      } else {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current)
          timeoutIdRef.current = null
        }
      }

      return () => {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current)
        }
      }
    }, [isFinishedLoading, router, redirectToSignIn])

    const isCorrectLevel = options.useHighestAAL
      ? aalData?.currentLevel === aalData?.nextLevel
      : true

    const shouldRedirect = isFinishedLoading && (!isLoggedIn || !isCorrectLevel)

    useEffect(() => {
      if (shouldRedirect) {
        // Clear the timeout if it's still active and we are redirecting
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current)
          timeoutIdRef.current = null
        }
        redirectToSignIn()
      }
    }, [redirectToSignIn, shouldRedirect])

    const InnerComponent = WrappedComponent as any

    const supportContext =
      typeof router.query.ref === 'string' && router.pathname.startsWith('/project/')
        ? {
            projectRef: router.query.ref,
            ...(typeof router.query.organizationSlug === 'string' && {
              orgSlug: router.query.organizationSlug,
            }),
          }
        : undefined

    return (
      <>
        <SessionTimeoutModal
          visible={isSessionTimeoutModalOpen}
          onClose={() => setIsSessionTimeoutModalOpen(false)}
          redirectToSignIn={redirectToSignIn}
          supportContext={supportContext}
        />
        <InnerComponent {...props} />
      </>
    )
  }

  WithAuthHOC.displayName = `withAuth(${WrappedComponent.displayName})`

  if (isNextPageWithLayout(WrappedComponent)) {
    ;(WithAuthHOC as NextPageWithLayout<T, T>).getLayout = WrappedComponent.getLayout
  }

  return WithAuthHOC
}
