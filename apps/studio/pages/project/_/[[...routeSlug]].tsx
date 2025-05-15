import { AlertTriangleIcon, Boxes } from 'lucide-react'
import { NextPage } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment } from 'react'

import { IS_PLATFORM } from 'common'
import { ProjectList } from 'components/interfaces/Home/ProjectList'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { withAuth } from 'hooks/misc/withAuth'
import { BASE_PATH } from 'lib/constants'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

const Header = () => {
  return (
    <div className="border-default border-b p-3">
      <div className="flex items-center space-x-2">
        <Link href="/projects">
          <img
            src={`${BASE_PATH}/img/supabase-logo.svg`}
            alt="Supabase"
            className="border-default rounded border p-1 hover:border-white"
            style={{ height: 24 }}
          />
        </Link>
      </div>
    </div>
  )
}

// [Joshen] I'd say we don't do route validation here, this page will act more
// like a proxy to the project specific pages, and we let those pages handle
// any route validation logic instead

const GenericProjectPage: NextPage = () => {
  const router = useRouter()
  const { routeSlug, ...queryParams } = router.query

  const {
    data: organizations,
    isLoading: isLoadingOrganizations,
    isError: isErrorOrganizations,
  } = useOrganizationsQuery({
    enabled: IS_PLATFORM,
  })

  const query = Object.keys(queryParams).length
    ? `?${new URLSearchParams(queryParams as Record<string, string>)}`
    : undefined

  const urlRewriterFactory = (slug: string | string[] | undefined) => {
    return (projectRef: string) => {
      const hash = location.hash

      if (!Array.isArray(slug)) {
        return [`/project/${projectRef}`, query, hash].filter(Boolean).join('')
      }

      const slugPath = slug.join('/')
      return [`/project/${projectRef}/${slugPath}`, query, hash].filter(Boolean).join('')
    }
  }

  return (
    <>
      <Header />
      <div className="flex flex-col mx-auto w-full max-w-5xl">
        <h1 className="mt-8 text-2xl">Select a project to continue</h1>
        <div
          className="flex-grow py-6 space-y-8 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 49px - 64px)' }}
        >
          {isLoadingOrganizations ? (
            <OrganizationLoadingState />
          ) : isErrorOrganizations ? (
            <OrganizationErrorState />
          ) : (
            organizations.map((organization) => (
              <Fragment key={organization.id}>
                <h2 className="flex items-center gap-2">
                  <Boxes size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                  {organization.name}
                </h2>
                <ProjectList
                  forOrganization={organization}
                  rewriteHref={urlRewriterFactory(routeSlug)}
                  search=""
                />
              </Fragment>
            ))
          )}
        </div>
      </div>
    </>
  )
}

function OrganizationLoadingState() {
  return (
    <>
      <ShimmeringLoader className="w-3/4" />
      <ShimmeringLoader className="w-1/2" />
      <ShimmeringLoader className="w-1/4" />
    </>
  )
}

function OrganizationErrorState() {
  return (
    <Alert_Shadcn_ variant="warning">
      <AlertTriangleIcon />
      <AlertTitle_Shadcn_>Failed to load your Supabase organizations</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>Try refreshing the page</AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export default withAuth(GenericProjectPage)
