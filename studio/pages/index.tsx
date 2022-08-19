import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { NextRouter, useRouter } from 'next/router'

import { NextPageWithLayout } from 'types'
import { useProfile, useStore, withAuth } from 'hooks'
import { auth } from 'lib/gotrue'
import { IS_PLATFORM } from 'lib/constants'

import Connecting from 'components/ui/Loading'
import { AccountLayoutWithoutAuth } from 'components/layouts'
import Landing from 'components/interfaces/Home/Landing'
import ProjectList from 'components/interfaces/Home/ProjectList'
import OrganizationDropdown from 'components/to-be-cleaned/Dropdown/OrganizationDropdown'

const Home: NextPageWithLayout = () => {
  const { app } = useStore()

  return (
    <>
      {app.organizations.isLoading ? (
        <div className="flex h-full items-center justify-center space-x-2">
          <Connecting />
        </div>
      ) : (
        <div className="py-4 px-5">
          {IS_PLATFORM && (
            <div className="my-2">
              <div className="flex">
                <div className="">
                  <OrganizationDropdown organizations={app.organizations} />
                </div>
              </div>
            </div>
          )}
          <div className="my-8 space-y-8">
            <ProjectList />
          </div>
        </div>
      )}
    </>
  )
}

Home.getLayout = (page) => <IndexLayout>{page}</IndexLayout>

export default observer(Home)

// detect for redirect from 3rd party service like vercel, aws...
const isRedirectFromThirdPartyService = (router: NextRouter) => router.query.next !== undefined

const UnauthorizedLanding = () => {
  const router = useRouter()
  const autoLogin = isRedirectFromThirdPartyService(router)

  useEffect(() => {
    if (autoLogin) {
      const queryParams = (router.query as any) || {}
      const params = new URLSearchParams(queryParams)
      // trigger github signIn
      auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}?${params.toString()}`,
        },
      })
    }
  }, [])

  return autoLogin ? <Connecting /> : <Landing />
}

const IndexLayout = withAuth(
  observer(({ children }) => {
    const router = useRouter()
    const { profile, isLoading } = useProfile()

    if (isLoading) {
      return <Connecting />
    }

    if (!profile) {
      return <UnauthorizedLanding />
    } else {
      const isRedirect = isRedirectFromThirdPartyService(router)
      if (isRedirect) {
        const queryParams = (router.query as any) || {}
        const params = new URLSearchParams(queryParams)
        if (router.query?.next?.includes('https://vercel.com')) {
          router.push(`/vercel/integrate?${params.toString()}`)
        } else if (router.query?.next?.includes('new-project')) {
          router.push('/new/project')
        } else if (router.query?.next?.includes('join')) {
          router.push(`/${router.query.next}`)
        } else if (
          typeof router.query?.next === 'string' &&
          router.query?.next?.startsWith('project/_/')
        ) {
          router.push(router.query.next as string)
        } else {
          router.push('/')
        }

        return <Connecting />
      }
    }

    return (
      <AccountLayoutWithoutAuth
        title="Supabase"
        breadcrumbs={[
          {
            key: `supabase-projects`,
            label: 'Projects',
          },
        ]}
      >
        {children}
      </AccountLayoutWithoutAuth>
    )
  })
)
