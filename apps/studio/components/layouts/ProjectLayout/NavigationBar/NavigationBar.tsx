import { useParams } from 'common'
import { Home, User } from 'icons'
import { isUndefined } from 'lodash'
import { Command, FileText, FlaskConical, Search, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import {
  useIsAPIDocsSidePanelEnabled,
  useIsAssistantV2Enabled,
} from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
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

  const navLayoutV2 = useFlag('navigationLayoutV2')
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()
  const isFunctionsAssistantEnabled = useIsAssistantV2Enabled()
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

  const CommandButton = !isFunctionsAssistantEnabled ? (
    <NavigationIconButton
      size="tiny"
      onClick={() => {
        setCommandMenuOpen(true)
        snap.setNavigationPanelOpen(false)
      }}
      type="text"
      icon={<Search size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />}
      rightText={
        <div
          className={cn(
            'flex items-center gap-1',
            'h-6 py-1.5 px-2 leading-none',
            'bg-surface-100 text-foreground-lighter',
            'border border-default rounded-md',
            'shadow-xs shadow-background-surface-100'
          )}
        >
          {os === 'macos' || true ? ( // todo: issue with `os` and hydration fail
            <Command size={11.5} strokeWidth={1.5} />
          ) : (
            <p className="text-xs">CTRL</p>
          )}
          <p className="text-xs">K</p>
        </div>
      }
    >
      Search
    </NavigationIconButton>
  ) : (
    <HoverCard_Shadcn_ openDelay={10}>
      <HoverCardTrigger_Shadcn_ asChild>
        <NavigationIconButton
          size="tiny"
          type="text"
          icon={<Command size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />}
        >
          Commands
        </NavigationIconButton>
      </HoverCardTrigger_Shadcn_>
      <HoverCardContent_Shadcn_ side="right" className="w-48 p-1 flex flex-col gap-y-1">
        <CommandOption
          icon={
            <div className="px-1">
              <Search size={16} />
            </div>
          }
          label="Search"
          shortcut="K"
          onClick={() => {
            setCommandMenuOpen(true)
            snap.setNavigationPanelOpen(false)
          }}
        />
        <CommandOption
          icon={
            <AiIconAnimation className="scale-75 [&>div>div]:border-black dark:[&>div>div]:border-white" />
          }
          label="Assistant"
          shortcut="I"
          onClick={() => {
            snap.setAiAssistantPanel({ open: !snap.aiAssistantPanel.open })
          }}
        />
      </HoverCardContent_Shadcn_>
    </HoverCard_Shadcn_>
  )

  const UserAccountButton = (
    <Button
      type="text"
      size="tiny"
      className={cn(
        'mt-3 h-10 [&>span]:relative [&>span]:flex [&>span]:w-full [&>span]:h-full p-0'
      )}
      block
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <figure className="absolute left-1.5 min-h-6 min-w-6 bg-foreground rounded-full flex items-center justify-center">
          <User size={ICON_SIZE - 2} strokeWidth={ICON_STROKE_WIDTH} className="text-background" />
        </figure>
        <span
          className={cn(
            'w-[8rem] flex flex-col items-start text-sm truncate',
            'absolute left-7 group-data-[state=expanded]:left-10',
            'group-data-[state=collapsed]:opacity-0 group-data-[state=expanded]:opacity-100',
            'transition-all'
          )}
        >
          {profile && IS_PLATFORM && (
            <>
              <span title={profile.username} className="w-full text-left text-foreground truncate">
                {profile.username}
              </span>
              {profile.primary_email !== profile.username && (
                <span
                  title={profile.primary_email}
                  className="w-full text-left text-foreground-light text-xs truncate"
                >
                  {profile.primary_email}
                </span>
              )}
            </>
          )}
        </span>
      </div>
    </Button>
  )

  return (
    <div className="w-14 h-full flex flex-col">
      <nav
        data-state={snap.navigationPanelOpen ? 'expanded' : 'collapsed'}
        className={cn(
          'group py-2 z-10 h-full w-14 data-[state=expanded]:w-[13rem]',
          'border-r bg-dash-sidebar border-default data-[state=expanded]:shadow-xl',
          'transition-width duration-200',
          'hide-scrollbar flex flex-col justify-between overflow-y-auto'
        )}
        onMouseEnter={() => allowNavPanelToExpand && snap.setNavigationPanelOpen(true)}
        onMouseLeave={() => {
          if (!userDropdownOpen && allowNavPanelToExpand) snap.setNavigationPanelOpen(false)
        }}
      >
        <ul className="flex flex-col gap-y-1 justify-start px-2 relative">
          {(!navLayoutV2 || !IS_PLATFORM) && (
            <Link
              href={IS_PLATFORM ? '/projects' : `/project/${projectRef}`}
              className="mx-2 flex items-center h-[40px]"
              onClick={onCloseNavigationIconLink}
            >
              <img
                alt="Supabase"
                src={`${router.basePath}/img/supabase-logo.svg`}
                className="absolute h-[40px] w-6 cursor-pointer rounded"
              />
            </Link>
          )}
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
        </ul>

        <ul className="flex flex-col px-2 gap-y-1">
          {settingsRoutes.map((route) => (
            <NavigationIconLink
              key={route.key}
              route={route}
              isActive={activeRoute === route.key}
              onClick={onCloseNavigationIconLink}
            />
          ))}

          {IS_PLATFORM && (
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
          )}

          <DropdownMenu
            open={userDropdownOpen}
            onOpenChange={(open: boolean) => {
              setUserDropdownOpenState(open)
              if (open === false) snap.setNavigationPanelOpen(false)
            }}
          >
            {allowNavPanelToExpand ? (
              <DropdownMenuTrigger asChild>{UserAccountButton}</DropdownMenuTrigger>
            ) : (
              <Tooltip_Shadcn_>
                <TooltipTrigger_Shadcn_ asChild>
                  <DropdownMenuTrigger asChild>{UserAccountButton}</DropdownMenuTrigger>
                </TooltipTrigger_Shadcn_>
                <TooltipContent_Shadcn_ side="right">
                  <span>Account settings</span>
                </TooltipContent_Shadcn_>
              </Tooltip_Shadcn_>
            )}

            <DropdownMenuContent side="top" align="start">
              {IS_PLATFORM && (
                <>
                  <div className="px-2 py-1 flex flex-col gap-0 text-sm">
                    {profile && (
                      <>
                        <span
                          title={profile.username}
                          className="w-full text-left text-foreground truncate"
                        >
                          {profile.username}
                        </span>
                        {profile.primary_email !== profile.username && (
                          <span
                            title={profile.primary_email}
                            className="w-full text-left text-foreground-light text-xs truncate"
                          >
                            {profile.primary_email}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="flex gap-2" asChild>
                      <Link href="/account/me">
                        <Settings size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                        Account preferences
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex gap-2"
                      onClick={() => snap.setShowFeaturePreviewModal(true)}
                      onSelect={() => snap.setShowFeaturePreviewModal(true)}
                    >
                      <FlaskConical
                        size={14}
                        strokeWidth={1.5}
                        className="text-foreground-lighter"
                      />
                      Feature previews
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </DropdownMenuGroup>
                </>
              )}
              <DropdownMenuGroup>
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(value) => {
                    setTheme(value)
                  }}
                >
                  {singleThemes.map((theme: Theme) => (
                    <DropdownMenuRadioItem key={theme.value} value={theme.value}>
                      {theme.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              {IS_PLATFORM && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onSelect={async () => {
                        await signOut()
                        await router.push('/sign-in')
                      }}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </ul>
      </nav>
    </div>
  )
}

export default NavigationBar
