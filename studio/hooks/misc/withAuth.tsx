import { useProfile, useStore } from 'hooks'
import { ComponentType, useEffect, useState } from 'react'
import { flatten } from 'lodash'
import { NextRouter, useRouter } from 'next/router'
import { IS_PLATFORM } from 'lib/constants'
import Connecting from 'components/ui/Loading'
import { Project } from 'types'

const PLATFORM_ONLY_PAGES = ['storage', 'reports', 'settings']

export function withAuth(
  WrappedComponent: ComponentType,
  options?: {
    redirectTo: string
    redirectIfFound?: boolean
  }
) {
  const redirectTo = options?.redirectTo ?? '/'
  const redirectIfFound = options?.redirectIfFound

  return (props: any) => {
    const router = useRouter()
    const rootStore = useStore()
    const [isConnecting, setConnecting] = useState(true)

    const { ref, slug } = router.query
    const { app, ui } = rootStore

    const returning =
      app.projects.isInitialized && app.organizations.isInitialized ? 'minimal' : undefined
    const { profile, isLoading } = useProfile(returning)

    const isRedirecting = checkRedirectTo(isLoading, router, profile, redirectTo, redirectIfFound)

    // We might probably be able to bring this into a _middleware with next 12
    if (!IS_PLATFORM) {
      // Hide routes for self-hosted version until features are functionally ready
      const page = router.pathname.split('/')[3]
      if (PLATFORM_ONLY_PAGES.includes(page)) {
        router.push(`/project/${ref}`)
      }
    }

    useEffect(() => {
      // this should run before redirecting
      if (!isLoading) {
        if (!profile) {
          ui.setProfile(undefined)
        } else if (returning !== 'minimal') {
          const { organizations, ...userProfile } = profile
          const projects: Project[] = flatten(organizations?.map((org: any) => org.projects))
          app.organizations.initialDataArray(organizations)
          app.projects.initialDataArray(projects)
          ui.setProfile(userProfile)
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

    useEffect(() => {
      if (!isLoading && !isRedirecting && router.isReady) {
        setConnecting(false)
      }
    }, [isLoading, isRedirecting, router.isReady])

    if (isConnecting) return <Connecting />

    return <WrappedComponent {...props} />
  }
}

function checkRedirectTo(
  loading: boolean,
  router: NextRouter,
  profile: any,
  redirectTo: string,
  redirectIfFound?: boolean
) {
  if (loading) return false
  if (router.asPath == redirectTo) return false

  // If redirectTo is set, redirect if the user was not found.
  if (redirectTo && !redirectIfFound && !profile) return true
  // If redirectIfFound is also set, redirect if the user was found
  if (redirectIfFound && profile) return true

  return false
}
