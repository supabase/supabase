import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useFlag, useIsFeatureEnabled } from 'hooks'
import { Home, User } from 'icons'
import { IS_PLATFORM } from 'lib/constants'
import { detectOS } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { isUndefined } from 'lodash'
import { Command, FileText, FlaskConical, Search, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuTrigger,
  Separator,
  Theme,
  cn,
  themes,
  useCommandMenu,
} from 'ui'
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

const NavigationBar = () => {
  const os = detectOS()
  const router = useRouter()
  const snap = useAppStateSnapshot()
  const { theme, setTheme } = useTheme()
  const { ref: projectRef } = useParams()
  const { setIsOpen } = useCommandMenu()

  const { profile } = useProfile()

  const [userDropdownOpen, setUserDropdownOpenState] = useState(false)

  const { project } = useProjectContext()
  const navLayoutV2 = useFlag('navigationLayoutV2')
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()

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

  const activeRoute = router.pathname.split('/')[3]
  const toolRoutes = generateToolRoutes(projectRef, project)
  const productRoutes = generateProductRoutes(projectRef, project, {
    auth: authEnabled,
    edgeFunctions: edgeFunctionsEnabled,
    storage: storageEnabled,
    realtime: realtimeEnabled,
  })

  const otherRoutes = generateOtherRoutes(projectRef, project)
  const settingsRoutes = generateSettingsRoutes(projectRef, project)

  return (
    <div className="w-14 h-full flex flex-col">
      <nav
        data-state={snap.navigationPanelOpen ? 'expanded' : 'collapsed'}
        className={[
          'z-10',
          'bg-studio',
          'data-[state=expanded]:shadow-xl',
          'h-full',
          'transition-width duration-200',
          'w-14 data-[state=expanded]:w-[13rem]',
          'py-2',
          'hide-scrollbar flex flex-col justify-between overflow-y-auto',
          'border-r bg-studio border-default',
          'group',
        ].join(' ')}
        onMouseEnter={() => {
          snap.setNavigationPanelOpen(true)
        }}
        onMouseLeave={() => {
          if (!userDropdownOpen) snap.setNavigationPanelOpen(false)
        }}
      >
        <ul className="flex flex-col gap-0 justify-start px-2">
          {(!navLayoutV2 || !IS_PLATFORM) && (
            <Link
              href={IS_PLATFORM ? '/projects' : `/project/${projectRef}`}
              className="mx-2 flex items-center h-[40px]"
            >
              <img
                src={`${router.basePath}/img/supabase-logo.svg`}
                alt="Supabase"
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
            }}
          />
          <Separator className="my-1 bg-border-muted" />
          {toolRoutes.map((route) => (
            <NavigationIconLink
              key={route.key}
              route={route}
              isActive={activeRoute === route.key}
            />
          ))}
          <Separator className="my-1 bg-border-muted" />
          {productRoutes.map((route) => (
            <NavigationIconLink
              key={route.key}
              route={route}
              isActive={activeRoute === route.key}
            />
          ))}
          <Separator className="my-1 bg-border-muted" />
          {otherRoutes.map((route) => {
            if (route.key === 'api' && isNewAPIDocsEnabled) {
              return (
                <NavigationIconButton
                  key={route.key}
                  onClick={() => snap.setShowProjectApiDocs(true)}
                  icon={<FileText size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />}
                >
                  Project API
                </NavigationIconButton>
              )
            } else {
              return (
                <NavigationIconLink
                  key={route.key}
                  route={route}
                  isActive={activeRoute === route.key}
                />
              )
            }
          })}
        </ul>

        <ul className="flex flex-col px-2">
          {settingsRoutes.map((route) => (
            <NavigationIconLink
              key={route.key}
              route={route}
              isActive={activeRoute === route.key}
            />
          ))}

          {IS_PLATFORM && (
            <NavigationIconButton
              size="tiny"
              onClick={() => setIsOpen(true)}
              type="text"
              icon={<Search size={ICON_SIZE} strokeWidth={2} />}
              rightText={
                <div
                  className={cn(
                    'flex items-center gap-1',
                    'h-6',
                    'py-1.5 px-2',
                    'bg-surface-100',
                    'text-foreground-lighter',
                    'border border-default rounded-md',
                    'shadow-xs shadow-background-surface-100',
                    'leading-none'
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
          )}

          <DropdownMenu
            open={userDropdownOpen}
            onOpenChange={(open: boolean) => {
              console.log('open', open)
              setUserDropdownOpenState(open)
              if (open === false) {
                snap.setNavigationPanelOpen(false)
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                type="text"
                size="tiny"
                className={cn(
                  'mt-3',
                  'h-10 [&>span]:relative [&>span]:flex [&>span]:w-full [&>span]:h-full p-0'
                )}
                block
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <figure className="absolute left-1 min-h-7 min-w-7 bg-foreground rounded-full flex items-center justify-center">
                    <User
                      size={ICON_SIZE - 2}
                      strokeWidth={ICON_STROKE_WIDTH}
                      className="text-background"
                    />
                  </figure>
                  <span
                    className=" 
                    left-10
                    w-[8rem]
                    absolute
                    
                    flex flex-col 
                    items-start
                    text-sm 

                    
                    group-data-[state=collapsed]:opacity-0 
                    group-data-[state=expanded]:opacity-100 

                    transition-all 
                    duration-200 
                    delay-100                   

                    truncate
                  "
                  >
                    <span className="w-full text-left text-foreground truncate">
                      {profile?.username}
                    </span>
                    <span className="w-full text-left text-foreground-light text-xs truncate">
                      {profile?.primary_email}
                    </span>
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start">
              {IS_PLATFORM && (
                <>
                  <DropdownMenuSub>{}</DropdownMenuSub>
                  <DropdownMenuItem key="header" className="space-x-2" asChild>
                    <Link href="/account/me">
                      <Settings size={14} strokeWidth={1.5} />
                      <p>Account preferences</p>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    key="header"
                    className="space-x-2"
                    onClick={() => snap.setShowFeaturePreviewModal(true)}
                    onSelect={() => snap.setShowFeaturePreviewModal(true)}
                  >
                    <FlaskConical size={14} strokeWidth={2} />
                    <p>Feature previews</p>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(value) => {
                    setTheme(value)
                  }}
                >
                  {themes
                    .filter(
                      (x) => x.value === 'light' || x.value === 'dark' || x.value === 'system'
                    )
                    .map((theme: Theme) => (
                      <DropdownMenuRadioItem key={theme.value} value={theme.value}>
                        {theme.name}
                      </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </ul>
      </nav>
    </div>
  )
}

export default NavigationBar
