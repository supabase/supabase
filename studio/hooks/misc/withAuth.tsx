import { useRouter } from 'next/router'
import Script from 'next/script'
import { ComponentType, useEffect } from 'react'

import { useParams } from 'common/hooks'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useAuthenticatorAssuranceLevelQuery } from 'data/profile/mfa-authenticator-assurance-level-query'
import { useSelectedProject, useStore } from 'hooks'
import { useAuth } from 'lib/auth'
import { IS_PLATFORM } from 'lib/constants'
import { STORAGE_KEY, getReturnToPath } from 'lib/gotrue'
import { NextPageWithLayout, isNextPageWithLayout } from 'types'
import Error500 from '../../pages/500'

const PLATFORM_ONLY_PAGES = [
  'reports',
  'settings',
  'auth/providers',
  'auth/templates',
  'auth/url-configuration',
]

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
  const WithAuthHOC: ComponentType<T> = (props) => {
    const router = useRouter()
    const { basePath } = router
    const { ref } = useParams()
    const rootStore = useStore()
    const { isLoading, session } = useAuth()
    const { isLoading: isAALLoading, data: aalData } = useAuthenticatorAssuranceLevelQuery()

    const { ui } = rootStore
    const page = router.pathname.split('/').slice(3).join('/')

    const redirectTo = defaultRedirectTo(ref)

    usePermissionsQuery({
      onError(error: any) {
        ui.setNotification({
          error,
          category: 'error',
          message: `Failed to fetch permissions: ${error.message}. Try refreshing your browser, or reach out to us via a support ticket if the issue persists`,
        })
      },
    })

    const isLoggedIn = Boolean(session)
    const isCorrectLevel = options.useHighestAAL
      ? aalData?.currentLevel === aalData?.nextLevel
      : true

    const isAccessingBlockedPage =
      !IS_PLATFORM &&
      PLATFORM_ONLY_PAGES.some((platformOnlyPage) => page.startsWith(platformOnlyPage))
    const isRedirecting =
      isAccessingBlockedPage ||
      checkRedirectTo(
        isLoading || isAALLoading,
        router.pathname,
        isLoggedIn,
        isCorrectLevel,
        redirectTo
      )

    useEffect(() => {
      // This should run after setting store data
      if (isRedirecting) {
        const searchParams = new URLSearchParams(location.search)
        searchParams.set('returnTo', location.pathname)
        const url = `${redirectTo}?${searchParams.toString()}`
        router.push(url)
      }
    }, [isRedirecting, redirectTo])

    const selectedProject = useSelectedProject()
    useEffect(() => {
      if (selectedProject) {
        rootStore.setProject(selectedProject)
      }
    }, [selectedProject])

    if (!isLoading && !isRedirecting && !isLoggedIn) {
      return <Error500 />
    }

    const InnerComponent = WrappedComponent as any

    return (
      <>
        {/* This script will quickly (before the main JS loads) redirect the user
          to the login page if they are guaranteed (no token at all) to not be logged in. */}
        {IS_PLATFORM && (
          <Script
            id="redirect-if-not-logged-in"
            dangerouslySetInnerHTML={{
              __html: `
              window._getReturnToPath = ${getReturnToPath.toString()};
              if (!localStorage.getItem('${STORAGE_KEY}') && !location.hash) {
                const searchParams = new URLSearchParams(location.search);
                searchParams.set('returnTo', location.pathname);
                location.replace('${basePath ?? ''}/sign-in' + '?' + searchParams.toString())
              }`,
            }}
          />
        )}
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

function defaultRedirectTo(ref: string | string[] | undefined) {
  return IS_PLATFORM ? `/sign-in` : ref !== undefined ? `/project/${ref}` : '/projects'
}

function checkRedirectTo(
  loading: boolean,
  pathname: string,
  isLoggedIn: boolean,
  isCorrectLevel: boolean,
  redirectTo: string
) {
  if (loading) return false
  if (pathname === redirectTo) return false

  // If redirectTo is set, redirect if the user is not logged in or logged in with MFA.
  if (redirectTo && (!isLoggedIn || !isCorrectLevel)) return true

  return false
}
