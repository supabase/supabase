import { NextPage } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'

import ShimmeringCard from 'components/interfaces/Home/ProjectList/ShimmeringCard'
import CardButton from 'components/ui/CardButton'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { withAuth } from 'hooks/misc/withAuth'
import { BASE_PATH } from 'lib/constants'
import { Button, IconPlus } from 'ui'

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

const GenericOrganizationPage: NextPage = () => {
  const router = useRouter()

  const { data: organizations, isLoading } = useOrganizationsQuery()
  const { routeSlug, ...queryParams } = router.query
  const queryString =
    Object.keys(queryParams).length > 0
      ? new URLSearchParams(queryParams as Record<string, string>).toString()
      : ''

  const urlRewriterFactory = (slug: string | string[] | undefined) => {
    return (orgSlug: string) => {
      if (!Array.isArray(slug)) {
        return `/org/${orgSlug}/general?${queryString}`
      } else {
        const slugPath = slug.reduce((a: string, b: string) => `${a}/${b}`, '').slice(1)
        return `/org/${orgSlug}/${slugPath}?${queryString}`
      }
    }
  }

  return (
    <>
      <Header />
      <div className="flex flex-col mx-auto w-full max-w-5xl space-y-3">
        <h3 className="mt-8 text-2xl">Select an organization to continue</h3>
        <div
          className="flex-grow py-6 space-y-8 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 49px - 64px)' }}
        >
          {isLoading ? (
            <ul
              className={[
                'mx-auto grid grid-cols-1 gap-4',
                'sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
              ].join(' `')}
            >
              <ShimmeringCard />
              <ShimmeringCard />
            </ul>
          ) : organizations?.length === 0 ? (
            <div className="col-span-4 space-y-4 rounded-lg border border-dashed border-muted p-6 text-center">
              <div className="space-y-1">
                <p>You are not part of any organizations yet</p>
                <p className="text-sm text-foreground-light">
                  Get started by creating a new organization.
                </p>
              </div>
              <div>
                <Button asChild icon={<IconPlus />}>
                  <Link href="/new">New organization</Link>
                </Button>
              </div>
            </div>
          ) : (
            <ul
              className={[
                'mx-auto grid grid-cols-1 gap-4',
                'sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
              ].join(' `')}
            >
              {organizations?.map((organization) => (
                <li key={organization.slug} className="col-span-1">
                  <CardButton
                    linkHref={urlRewriterFactory(routeSlug)(organization.slug)}
                    title={
                      <div className="flex w-full flex-row justify-between gap-1">
                        <span className="flex-shrink truncate">{organization.name}</span>
                      </div>
                    }
                    footer={
                      <div className="flex items-end justify-between">
                        <span className="text-sm lowercase text-foreground-light">
                          {organization.slug}
                        </span>
                      </div>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

export default withAuth(GenericOrganizationPage)
