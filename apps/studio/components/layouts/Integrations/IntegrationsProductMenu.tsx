import { useParams } from 'common'
import { useRouter } from 'next/router'
import { Menu, Separator } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

import { getCategoryParamFromAsPath, getIntegrationsPageFromPathname } from './Integrations.utils'
import { generateIntegrationsMenu } from './IntegrationsMenu.utils'
import { useInstalledIntegrations } from '@/components/interfaces/Integrations/Landing/useInstalledIntegrations'
import AlertError from '@/components/ui/AlertError'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { ProductMenuItem } from '@/components/ui/ProductMenu/ProductMenuItem'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { getPathnameWithoutQuery } from '@/lib/pathname.utils'

export function IntegrationsProductMenu() {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { integrationsWrappers: showWrappers } = useIsFeatureEnabled(['integrations:wrappers'])
  const resolvedProjectRef = projectRef ?? project?.ref

  const pathname = getPathnameWithoutQuery(router.asPath, router.pathname)
  const page = getIntegrationsPageFromPathname(pathname)
  const categoryParam = getCategoryParamFromAsPath(router.asPath)

  const {
    installedIntegrations: integrations,
    error,
    isLoading,
    isSuccess,
    isError,
  } = useInstalledIntegrations()

  const resolvedPage =
    page === 'integrations'
      ? categoryParam
        ? `integrations-${categoryParam}`
        : 'integrations'
      : page

  return (
    <>
      <ProductMenu
        page={resolvedPage}
        menu={generateIntegrationsMenu({ projectRef, flags: { showWrappers } })}
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
        {isSuccess &&
          resolvedProjectRef &&
          integrations.map((integration) => (
            <ProductMenuItem
              key={`integrations/${integration.id}`}
              isActive={page === `integrations/${integration.id}`}
              item={{
                name: integration.name,
                label: integration.status,
                key: `integrations/${integration.id}`,
                url: `/project/${resolvedProjectRef}/integrations/${integration.id}/overview`,
                icon: (
                  <div className="relative w-6 h-6 bg-white border rounded-sm flex items-center justify-center">
                    {integration.icon({ className: 'p-1' })}
                  </div>
                ),
                items: [],
              }}
            />
          ))}
      </div>
    </>
  )
}
