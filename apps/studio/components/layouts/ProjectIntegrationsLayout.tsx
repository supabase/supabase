import { useQuery } from '@tanstack/react-query'
import { IS_PLATFORM, useFeatureFlags, useFlag, useParams } from 'common'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'
import { Menu, Separator } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

import { useInstalledIntegrations } from '@/components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { ProjectLayout } from '@/components/layouts/ProjectLayout'
import AlertError from '@/components/ui/AlertError'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { marketplaceCategoriesQueryOptions } from '@/data/marketplace/integration-categories-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { withAuth } from '@/hooks/misc/withAuth'

/**
 * Layout component for the Integrations section
 * Provides sidebar navigation for integrations
 */
export const ProjectIntegrationsLayout = withAuth(({ children }: PropsWithChildren) => {
  const router = useRouter()
  const segments = router.asPath.split('/')
  // construct the page url to be used to determine the active state for the sidebar
  const page = `${segments[3]}${segments[4] ? `/${segments[4]}` : ''}`

  return (
    <ProjectLayout
      product="Integrations"
      browserTitle={{ section: 'Integrations' }}
      isBlocking={false}
      productMenu={
        <>
          <IntegrationCategoriesMenu page={page} />
          <Separator />
          <InstalledIntegrationsMenu page={page} />
        </>
      }
    >
      {children}
    </ProjectLayout>
  )
})

const IntegrationCategoriesMenu = ({ page }: { page: string }) => {
  const router = useRouter()
  const { ref } = useParams()
  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const isMarketplaceEnabled = useFlag('marketplaceIntegrations')

  const urlParams = new URLSearchParams(router.asPath.split('?')[1] || '')
  const categoryParam = urlParams.get('category')
  const pageKey = categoryParam || page

  const { integrationsWrappers: showWrappers } = useIsFeatureEnabled(['integrations:wrappers'])
  const { data: categories = [], isPending: isPendingCategories } = useQuery(
    marketplaceCategoriesQueryOptions({ enabled: isMarketplaceEnabled })
  )

  const isLoading = IS_PLATFORM
    ? !flagsLoaded || (isMarketplaceEnabled && isPendingCategories)
    : false

  const allCategories = [
    {
      name: 'All',
      key: 'integrations',
      url: `/project/${ref}/integrations`,
      pages: ['integrations'],
      items: [],
    },
    ...(showWrappers
      ? [
          {
            name: 'Wrappers',
            key: 'wrapper',
            url: `/project/${ref}/integrations?category=wrapper`,
            items: [],
          },
        ]
      : []),
    {
      name: 'Postgres Modules',
      key: 'postgres_extension',
      url: `/project/${ref}/integrations?category=postgres_extension`,
      items: [],
    },
    ...categories.map((category) => ({
      name: category.name ?? '',
      key: category.slug ?? '',
      url: `/project/${ref}/integrations?category=${category.slug}`,
      items: [],
    })),
  ]

  return (
    <>
      {isLoading ? (
        <div className="px-4 py-6 md:px-6">
          <Menu type="pills">
            <Menu.Group title={<span className="uppercase font-mono">Explore</span>} />
          </Menu>
          <GenericSkeletonLoader />
        </div>
      ) : (
        <ProductMenu
          page={pageKey}
          menu={[{ key: 'explore', title: 'Explore', items: allCategories }]}
        />
      )}
    </>
  )
}

const InstalledIntegrationsMenu = ({ page }: { page: string }) => {
  const { ref } = useParams()

  const {
    installedIntegrations: integrations,
    error,
    isLoading,
    isSuccess,
    isError,
  } = useInstalledIntegrations()

  const installedIntegrationItems = integrations.map((integration) => ({
    name: integration.name,
    label: integration.status,
    key: `integrations/${integration.id}`,
    url: `/project/${ref}/integrations/${integration.id}/overview`,
    icon: (
      <div className="relative w-6 h-6 bg-white border rounded-sm flex items-center justify-center">
        {integration.icon({ className: 'p-1' })}
      </div>
    ),
    items: [],
  }))

  return (
    <>
      {(isLoading || isError) && (
        <div className="px-4 py-6 md:px-6">
          <Menu type="pills">
            <Menu.Group title={<span className="uppercase font-mono">Installed</span>} />
          </Menu>
          {isLoading && <GenericSkeletonLoader />}
          {isError && (
            <AlertError
              showIcon={false}
              error={error}
              subject="Failed to retrieve installed integrations"
            />
          )}
        </div>
      )}
      {isSuccess && (
        <ProductMenu
          page={page}
          menu={[{ key: 'installed', title: 'Installed', items: installedIntegrationItems }]}
        />
      )}
    </>
  )
}
