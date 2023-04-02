import Head from 'next/head'
import { useRouter } from 'next/router'
import { ComponentType, useEffect } from 'react'

import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useStore } from 'hooks'
import { useParams } from 'common/hooks'
import { useAuth } from 'lib/auth'
import { IS_PLATFORM } from 'lib/constants'
import { getReturnToPath, STORAGE_KEY } from 'lib/gotrue'
import { isNextPageWithLayout, NextPageWithLayout } from 'types'
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
  options?: {
    redirectTo: string
    /* run the redirect if the user is logged in */
    redirectIfFound?: boolean
  }
) {
  const WithAuthHOC: ComponentType<T> = (props: any) => {
    const router = useRouter()
    const { basePath } = router
    const { ref, slug } = useParams()
    const rootStore = useStore()
    const { isLoading, session } = useAuth()

    const { app, ui } = rootStore
    const page = router.pathname.split('/').slice(3).join('/')

    const redirectTo = options?.redirectTo ?? defaultRedirectTo(ref)
    const redirectIfFound = options?.redirectIfFound

    useEffect(() => {
      if (!app.organizations.isInitialized) app.organizations.load()
      if (!app.projects.isInitialized) app.projects.load()
    }, [app.organizations.isInitialized, app.projects.isInitialized])

    usePermissionsQuery({
      enabled: IS_PLATFORM,
      onSuccess(permissions) {
        ui.setPermissions(permissions)
      },
    })

    const isLoggedIn = Boolean(session)

    const isAccessingBlockedPage =
      !IS_PLATFORM &&
      PLATFORM_ONLY_PAGES.some((platformOnlyPage) => page.startsWith(platformOnlyPage))
    const isRedirecting =
      isAccessingBlockedPage ||
      checkRedirectTo(isLoading, router.pathname, isLoggedIn, redirectTo, redirectIfFound)

    useEffect(() => {
      // This should run after setting store data
      if (isRedirecting) {
        router.push(redirectTo)
      }
    }, [isRedirecting, redirectTo])

    useEffect(() => {
      if (router.isReady) {
        if (ref) {
          rootStore.setProjectRef(ref)
        }
        rootStore.setOrganizationSlug(slug)
      }
    }, [isLoading, router.isReady, ref, slug])

    if (!isLoading && !isRedirecting && !isLoggedIn) {
      return <Error500 />
    }

    return (
      <>
        <Head>
          {/* This script will quickly (before the main JS loads) redirect the user
          to the login page if they are guaranteed (no token at all) to not be logged in. */}
          {IS_PLATFORM && (
            <script
              dangerouslySetInnerHTML={{
                __html: `window._getReturnToPath = ${getReturnToPath.toString()};if (!localStorage.getItem('${STORAGE_KEY}') && !location.hash) {const searchParams = new URLSearchParams(location.search);searchParams.set('returnTo', location.pathname);location.replace('${
                  basePath ?? ''
                }/sign-in' + '?' + searchParams.toString())}`,
              }}
            />
          )}
        </Head>
        <WrappedComponent {...props} />
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
  redirectTo: string,
  redirectIfFound?: boolean
) {
  if (loading) return false
  if (pathname === redirectTo) return false

  // If redirectTo is set, redirect if the user is not logged in.
  if (redirectTo && !redirectIfFound && !isLoggedIn) return true

  // If redirectIfFound is also set, redirect if the user was found
  if (redirectIfFound && isLoggedIn) return true

  return false
}
