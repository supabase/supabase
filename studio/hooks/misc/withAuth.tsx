import Head from 'next/head'
import { NextRouter, useRouter } from 'next/router'
import { ComponentType, useEffect } from 'react'

import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProfileQuery } from 'data/profile/profile-query'
import { useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { getReturnToPath, STORAGE_KEY } from 'lib/gotrue'
import { NextPageWithLayout } from 'types'
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
    redirectIfFound?: boolean
  }
) {
  const WithAuthHOC: ComponentType<T> = (props: any) => {
    const router = useRouter()
    const rootStore = useStore()

    const { ref, slug } = router.query
    const { app, ui } = rootStore
    const page = router.pathname.split('/').slice(3).join('/')

    const redirectTo = options?.redirectTo ?? defaultRedirectTo(ref)
    const redirectIfFound = options?.redirectIfFound

    const {
      data: profile,
      isLoading,
      error,
    } = useProfileQuery({
      onSuccess(profile) {
        ui.setProfile(profile)

        if (!app.organizations.isInitialized) app.organizations.load()
        if (!app.projects.isInitialized) app.projects.load()
      },
    })

    usePermissionsQuery({
      onSuccess(permissions) {
        ui.setPermissions(permissions)
      },
    })

    const isAccessingBlockedPage =
      !IS_PLATFORM &&
      PLATFORM_ONLY_PAGES.some((platformOnlyPage) => page.startsWith(platformOnlyPage))
    const isRedirecting =
      isAccessingBlockedPage ||
      checkRedirectTo(isLoading, router, profile, error, redirectTo, redirectIfFound)

    useEffect(() => {
      // This should run after setting store data
      if (isRedirecting) {
        router.push(redirectTo)
      }
    }, [isRedirecting, redirectTo])

    useEffect(() => {
      if (router.isReady) {
        if (ref) {
          rootStore.setProjectRef(Array.isArray(ref) ? ref[0] : ref)
        }
        rootStore.setOrganizationSlug(slug ? String(slug) : undefined)
      }
    }, [isLoading, router.isReady, ref, slug])

    if (!isLoading && !isRedirecting && !profile && error) {
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
                __html: `window._getReturnToPath = ${getReturnToPath.toString()};if (!localStorage.getItem('${STORAGE_KEY}') && !location.hash) {const searchParams = new URLSearchParams(location.search);searchParams.set('returnTo', location.pathname);location.replace('/sign-in' + '?' + searchParams.toString())}`,
              }}
            />
          )}
        </Head>
        <WrappedComponent {...props} />
      </>
    )
  }

  WithAuthHOC.displayName = `WithAuth(${WrappedComponent.displayName})`

  if ('getLayout' in WrappedComponent) {
    ;(WithAuthHOC as any).getLayout = WrappedComponent.getLayout
  }

  return WithAuthHOC
}

function defaultRedirectTo(ref: string | string[] | undefined) {
  return IS_PLATFORM ? '/sign-in' : ref !== undefined ? `/project/${ref}` : '/projects'
}

function checkRedirectTo(
  loading: boolean,
  router: NextRouter,
  profile: any,
  profileError: any,
  redirectTo: string,
  redirectIfFound?: boolean
) {
  if (loading) return false
  if (router.pathname == redirectTo) return false

  // If redirectTo is set, redirect if the user is not logged in.
  if (redirectTo && !redirectIfFound && profileError?.code === 401) return true

  // If redirectIfFound is also set, redirect if the user was found
  if (redirectIfFound && profile) return true

  return false
}
