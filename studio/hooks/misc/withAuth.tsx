import { useProfile, useStore } from 'hooks'
import { ComponentType, useEffect } from 'react'
import { NextRouter, useRouter } from 'next/router'
import { IS_PLATFORM } from 'lib/constants'

const PLATFORM_ONLY_PAGES = ['storage', 'reports', 'settings']

export function withAuth<T>(
  WrappedComponent: ComponentType<T>,
  options?: {
    redirectTo: string
    redirectIfFound?: boolean
  }
) {
  return (props: any) => {
    const router = useRouter()
    const rootStore = useStore()

    const { ref, slug } = router.query
    const { app, ui } = rootStore
    const page = router.pathname.split('/')[3]

    const redirectTo = options?.redirectTo ?? defaultRedirectTo(ref)
    const redirectIfFound = options?.redirectIfFound

    const returning =
      app.projects.isInitialized && app.organizations.isInitialized ? 'minimal' : undefined
    const { profile, isLoading } = useProfile(returning)

    const isAccessingBlockedPage = !IS_PLATFORM && PLATFORM_ONLY_PAGES.includes(page)
    const isRedirecting =
      isAccessingBlockedPage ||
      checkRedirectTo(isLoading, router, profile, redirectTo, redirectIfFound)

    useEffect(() => {
      // this should run before redirecting
      if (!isLoading) {
        if (!profile) {
          ui.setProfile(undefined)
        } else if (returning !== 'minimal') {
          ui.setProfile(profile)

          if (!app.organizations.isInitialized) {
            app.organizations.load()
          }
          if (!app.projects.isInitialized) {
            app.projects.load()
          }
        }
      }

      // this should run after setting store data
      if (isRedirecting) {
        router.push(redirectTo)
      }
    }, [isLoading, isRedirecting, profile])

    useEffect(() => {
      if (!isLoading && router.isReady) {
        rootStore.setProjectRef(ref ? String(ref) : undefined)
        rootStore.setOrganizationSlug(slug ? String(slug) : undefined)
      }
    }, [isLoading, router.isReady, ref, slug])

    return <WrappedComponent {...props} />
  }
}

function defaultRedirectTo(ref: string | string[] | undefined) {
  return IS_PLATFORM ? '/' : ref !== undefined ? `/project/${ref}` : '/'
}

function checkRedirectTo(
  loading: boolean,
  router: NextRouter,
  profile: any,
  redirectTo: string,
  redirectIfFound?: boolean
) {
  if (loading) return false
  if (router.pathname == redirectTo) return false

  // If redirectTo is set, redirect if the user was not found.
  if (redirectTo && !redirectIfFound && !profile) return true
  // If redirectIfFound is also set, redirect if the user was found
  if (redirectIfFound && profile) return true

  return false
}
