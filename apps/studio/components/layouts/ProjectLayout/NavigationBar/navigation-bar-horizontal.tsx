import { isUndefined } from 'lodash'
import { FileText } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useFlag } from 'hooks/ui/useFlag'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useProfile } from 'lib/profile'
import Link from 'next/link'
import { useAppStateSnapshot } from 'state/app-state'
import { NavMenu, NavMenuItem, Separator, cn } from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { useProjectContext } from '../ProjectContext'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateSettingsRoutes,
  generateToolRoutes,
} from './NavigationBar.utils'
import { NavigationIconButton } from './NavigationIconButton'
import NavigationIconLink from './NavigationIconLink'

export const ICON_SIZE = 20
export const ICON_STROKE_WIDTH = 1.5

export function ProjectNavigationBarHorizontal() {
  const router = useRouter()
  const { profile } = useProfile()
  const { project } = useProjectContext()

  const { ref: projectRef } = useParams()
  const setCommandMenuOpen = useSetCommandMenuOpen()
  const snap = useAppStateSnapshot()

  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()
  const [userDropdownOpen, setUserDropdownOpenState] = useState(false)

  const [allowNavPanelToExpand] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.EXPAND_NAVIGATION_PANEL,
    true
  )

  const {
    projectAuthAll: authEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
    projectStorageAll: storageEnabled,
    realtimeAll: realtimeEnabled,
  } = useIsFeatureEnabled([
    'project_auth:all',
    'project_edge_function:all',
    'project_storage:all',
    'realtime:all',
  ])

  const { data } = useProjectLintsQuery({
    projectRef: project?.ref,
  })

  const securityLints = (data ?? []).filter((lint) => lint.categories.includes('SECURITY'))
  const errorLints = securityLints.filter((lint) => lint.level === 'ERROR')

  const activeRoute = router.pathname.split('/')[3]
  const toolRoutes = generateToolRoutes(projectRef, project)
  const productRoutes = generateProductRoutes(projectRef, project, {
    auth: authEnabled,
    edgeFunctions: edgeFunctionsEnabled,
    storage: storageEnabled,
    realtime: realtimeEnabled,
  })
  const showWarehouse = useFlag('warehouse')

  const otherRoutes = generateOtherRoutes(projectRef, project)
  const settingsRoutes = generateSettingsRoutes(projectRef, project)

  const onCloseNavigationIconLink = (event: any) => {
    snap.setNavigationPanelOpen(
      false,
      event.target.id === 'icon-link' || ['svg', 'path'].includes(event.target.localName)
    )
  }

  return (
    <nav>
      <NavMenu className="mb-0 px-5">
        <Link href={`/project/${projectRef}`}>
          <NavMenuItem
            active={isUndefined(activeRoute) && !isUndefined(router.query.ref)}
            className="py-2"
          >
            Overview
          </NavMenuItem>
        </Link>

        {toolRoutes.map((route) => (
          <Link href={route.link ?? ''} key={route.key}>
            <NavMenuItem active={activeRoute === route.key} className="py-2">
              {route.label}
            </NavMenuItem>
          </Link>
        ))}
        {productRoutes.map((route) => (
          <>
            <Link href={route.link ?? ''} key={route.key}>
              <NavMenuItem active={activeRoute === route.key} className="py-2">
                {route.label}
              </NavMenuItem>
            </Link>
          </>
        ))}

        {/* <Separator className="my-1 bg-border-muted" /> */}
        {/* {otherRoutes.map((route) => {
          if (route.key === 'api' && isNewAPIDocsEnabled) {
            return (
              <NavigationIconButton
                key={route.key}
                onClick={() => {
                  snap.setShowProjectApiDocs(true)
                  snap.setNavigationPanelOpen(false)
                }}
                icon={<FileText size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />}
              >
                Project API
              </NavigationIconButton>
            )
          } else if (route.key === 'advisors') {
            return (
              <div className="relative" key={route.key}>
                {securityLints.length > 0 && (
                  <div
                    className={cn(
                      'absolute flex h-2 w-2 left-6 top-2 z-10 rounded-full',
                      errorLints.length > 0 ? 'bg-destructive-600' : 'bg-warning-600'
                    )}
                  />
                )}
                <NavigationIconLink
                  route={route}
                  isActive={activeRoute === route.key}
                  onClick={onCloseNavigationIconLink}
                />
              </div>
            )
          } else if (route.key === 'logs') {
            // TODO: Undo this when warehouse flag is removed
            const label = showWarehouse ? 'Logs & Analytics' : route.label
            const newRoute = { ...route, label }
            return (
              <NavigationIconLink
                key={newRoute.key}
                route={newRoute}
                isActive={activeRoute === newRoute.key}
                onClick={onCloseNavigationIconLink}
              />
            )
          } else {
            return (
              <NavigationIconLink
                key={route.key}
                route={route}
                isActive={activeRoute === route.key}
                onClick={onCloseNavigationIconLink}
              />
            )
          }
        })} */}
        {/* {settingsRoutes.map((route) => (
          <NavigationIconLink
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
            onClick={onCloseNavigationIconLink}
          />
        ))} */}
      </NavMenu>
    </nav>
  )
}
