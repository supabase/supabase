import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { ProjectLayout } from 'components/layouts/ProjectLayout'
import AlertError from 'components/ui/AlertError'
import { ProductMenu } from 'components/ui/ProductMenu'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { ProductMenuItem } from 'components/ui/ProductMenu/ProductMenuItem'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { Menu, Separator } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

/**
 * Layout component for the Integrations section
 * Provides sidebar navigation for integrations
 */
const IntegrationsLayout = ({ children }: PropsWithChildren) => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { integrationsWrappers: showWrappers } = useIsFeatureEnabled(['integrations:wrappers'])

  const segments = router.asPath.split('/')
  // construct the page url to be used to determine the active state for the sidebar
  const page = `${segments[3]}${segments[4] ? `/${segments[4]}` : ''}`

  // Check for category query parameter to determine active menu item
  const urlParams = new URLSearchParams(router.asPath.split('?')[1] || '')
  const categoryParam = urlParams.get('category')

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
    url: `/project/${project?.ref}/integrations/${integration.id}/overview`,
    icon: (
      <div className="relative w-6 h-6 bg-white border rounded flex items-center justify-center">
        {integration.icon({ className: 'p-1' })}
      </div>
    ),
    items: [],
  }))

  return (
    <ProjectLayout
      title={'Integrations'}
      product="Integrations"
      isBlocking={false}
      productMenu={
        <>
          <ProductMenu
            page={
              page === 'integrations'
                ? categoryParam
                  ? `integrations-${categoryParam}`
                  : 'integrations'
                : page
            }
            menu={generateIntegrationsMenu({ projectRef: project?.ref, flags: { showWrappers } })}
          />
          <Separator />
          <div className="px-4 py-6 md:px-6">
            <Menu.Group
              title={
                <div className="flex flex-col space-y-2 uppercase font-mono">
                  <span>Installed</span>
                </div>
              }
            />
            {isLoading && <GenericSkeletonLoader />}
            {isError && (
              <AlertError
                showIcon={false}
                error={error}
                subject="Failed to retrieve installed integrations"
              />
            )}
            {isSuccess && (
              <div>
                {installedIntegrationItems.map((item) => (
                  <ProductMenuItem key={item.key} isActive={page === item.key} item={item} />
                ))}
              </div>
            )}
          </div>
        </>
      }
    >
      {children}
    </ProjectLayout>
  )
}

// Wrap component with authentication HOC before exporting
export default withAuth(IntegrationsLayout)

const generateIntegrationsMenu = ({
  projectRef,
  flags,
}: {
  projectRef?: string
  flags?: { showWrappers: boolean }
}): ProductMenuGroup[] => {
  const { showWrappers } = flags ?? {}

  return [
    {
      title: 'Explore',
      items: [
        {
          name: 'All',
          key: 'integrations',
          url: `/project/${projectRef}/integrations`,
          pages: ['integrations'],
          items: [],
        },
        ...(showWrappers
          ? [
              {
                name: 'Wrappers',
                key: 'integrations-wrapper',
                url: `/project/${projectRef}/integrations?category=wrapper`,
                pages: ['integrations?category=wrapper'],
                items: [],
              },
            ]
          : []),
        {
          name: 'Postgres Modules',
          key: 'integrations-postgres_extension',
          url: `/project/${projectRef}/integrations?category=postgres_extension`,
          pages: ['integrations?category=postgres_extension'],
          items: [],
        },
      ],
    },
  ].filter(Boolean)
}
