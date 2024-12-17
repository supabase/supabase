import { Home, User } from 'icons'
import { isUndefined } from 'lodash'
import { Command, FileText, FlaskConical, Search, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import { ProjectIndexPageLink } from 'data/prefetchers/project.$ref'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useFlag } from 'hooks/ui/useFlag'
import { useSignOut } from 'lib/auth'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { detectOS } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useAppStateSnapshot } from 'state/app-state'
import {
  AiIconAnimation,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  HoverCardContent_Shadcn_,
  HoverCardTrigger_Shadcn_,
  HoverCard_Shadcn_,
  Separator,
  Theme,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
  singleThemes,
} from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { useProjectContext } from '../ProjectContext'
import { CommandOption } from './CommandOption'
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

const NavigationBar = () => {
  const os = detectOS()
  const router = useRouter()
  const { profile } = useProfile()
  const { project } = useProjectContext()
  const { theme, setTheme } = useTheme()
  const { ref: projectRef } = useParams()
  const setCommandMenuOpen = useSetCommandMenuOpen()
  const snap = useAppStateSnapshot()

  const signOut = useSignOut()

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
    <div className="w-14 flex flex-col">
      <nav
        data-state={snap.navigationPanelOpen ? 'expanded' : 'collapsed'}
        className={cn(
          'group py-2 z-10 h-full w-14 data-[state=expanded]:w-[13rem]',
          'bg border-default data-[state=expanded]:shadow-xl',
          'transition-width duration-200',
          'hide-scrollbar flex flex-col overflow-y-auto'
        )}
        onMouseEnter={() => allowNavPanelToExpand && snap.setNavigationPanelOpen(true)}
        onMouseLeave={() => {
          if (!userDropdownOpen && allowNavPanelToExpand) snap.setNavigationPanelOpen(false)
        }}
      >
        <ul className="flex flex-col gap-y-1 px-2 relative">
          <NavigationIconLink
            isActive={isUndefined(activeRoute) && !isUndefined(router.query.ref)}
            route={{
              key: 'HOME',
              label: 'Home',
              icon: <Home size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
              link: `/project/${projectRef}`,
              linkElement: <ProjectIndexPageLink projectRef={projectRef} />,
            }}
            onClick={onCloseNavigationIconLink}
          />
          <Separator className="my-1 bg-border-muted" />
          {toolRoutes.map((route) => (
            <NavigationIconLink
              key={route.key}
              route={route}
              isActive={activeRoute === route.key}
              onClick={onCloseNavigationIconLink}
            />
          ))}
          <Separator className="my-1 bg-border-muted" />
          {productRoutes.map((route) => (
            <NavigationIconLink
              key={route.key}
              route={route}
              isActive={activeRoute === route.key}
              onClick={onCloseNavigationIconLink}
            />
          ))}

          <Separator className="my-1 bg-border-muted" />
          {otherRoutes.map((route) => {
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
          })}
          <Separator className="my-1 bg-border-muted" />
          {settingsRoutes.map((route) => (
            <NavigationIconLink
              key={route.key}
              route={route}
              isActive={activeRoute === route.key}
              onClick={onCloseNavigationIconLink}
            />
          ))}
        </ul>

        <ul className="flex flex-col px-2 gap-y-1">
          {/* {IS_PLATFORM && (
            <>
              {!allowNavPanelToExpand && (
                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_ asChild>{CommandButton}</TooltipTrigger_Shadcn_>
                  <TooltipContent_Shadcn_ side="right">
                    <span>Commands</span>
                  </TooltipContent_Shadcn_>
                </Tooltip_Shadcn_>
              )}
              {allowNavPanelToExpand && CommandButton}
            </>
          )} */}
        </ul>
      </nav>
    </div>
  )
}

export default NavigationBar
