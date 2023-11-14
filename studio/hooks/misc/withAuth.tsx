import { useRouter } from 'next/router'
import { ComponentType, useEffect } from 'react'

import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useAuthenticatorAssuranceLevelQuery } from 'data/profile/mfa-authenticator-assurance-level-query'
import { useSelectedProject, useStore } from 'hooks'
import { useAuth } from 'lib/auth'
import { IS_PLATFORM } from 'lib/constants'
import { NextPageWithLayout, isNextPageWithLayout } from 'types'

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
    const rootStore = useStore()
    const { ui } = rootStore

    const { isLoading, session } = useAuth()
    const { isLoading: isAALLoading, data: aalData } = useAuthenticatorAssuranceLevelQuery({
      onError(error) {
        ui.setNotification({
          error,
          category: 'error',
          message: `Failed to fetch authenticator assurance level: ${error.message}. Try refreshing your browser, or reach out to us via a support ticket if the issue persists`,
        })
      },
    })

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
    const isFinishedLoading = !isLoading && !isAALLoading

    useEffect(() => {
      const isCorrectLevel = options.useHighestAAL
        ? aalData?.currentLevel === aalData?.nextLevel
        : true

      if (isFinishedLoading && (!isLoggedIn || !isCorrectLevel)) {
        const searchParams = new URLSearchParams(location.search)
        let pathname = location.pathname
        if (process.env.NEXT_PUBLIC_BASE_PATH) {
          pathname = pathname.replace(process.env.NEXT_PUBLIC_BASE_PATH, '')
        }

        searchParams.set('returnTo', pathname)

        router.push(`/sign-in?${searchParams.toString()}`)
      }
    }, [session, isLoading, router, aalData, isFinishedLoading, isLoggedIn])

    const selectedProject = useSelectedProject()
    useEffect(() => {
      if (selectedProject) {
        rootStore.setProject(selectedProject)
      }
    }, [selectedProject])

    const InnerComponent = WrappedComponent as any

    return <InnerComponent {...props} />
  }

  WithAuthHOC.displayName = `withAuth(${WrappedComponent.displayName})`

  if (isNextPageWithLayout(WrappedComponent)) {
    ;(WithAuthHOC as NextPageWithLayout<T, T>).getLayout = WrappedComponent.getLayout
  }

  return WithAuthHOC
}
