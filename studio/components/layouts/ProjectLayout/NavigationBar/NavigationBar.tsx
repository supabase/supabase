import * as Tooltip from '@radix-ui/react-tooltip'
import { useParams } from 'common'
import { isUndefined } from 'lodash'
import { FlaskConical } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/router'

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
  DropdownMenuTrigger,
  IconCommand,
  IconFileText,
  IconHome,
  IconSearch,
  IconSettings,
  IconUser,
  useCommandMenu,
} from 'ui'

import { useFlag, useIsFeatureEnabled } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { detectOS } from 'lib/helpers'
import { useAppStateSnapshot } from 'state/app-state'
import { useProjectContext } from '../ProjectContext'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateToolRoutes,
} from './NavigationBar.utils'
import NavigationIconButton from './NavigationIconButton'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'

const NavigationBar = () => {
  const os = detectOS()
  const router = useRouter()
  const snap = useAppStateSnapshot()
  const { theme, setTheme } = useTheme()
  const { ref: projectRef } = useParams()
  const { setIsOpen } = useCommandMenu()

  const { project } = useProjectContext()
  const navLayoutV2 = useFlag('navigationLayoutV2')
  const supabaseAIEnabled = useFlag('sqlEditorSupabaseAI')
  const showFeaturePreviews = useFlag('featurePreviews')
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
  const realtimeFlagEnabled = useFlag('realtimeDashboard')

  const activeRoute = router.pathname.split('/')[3]
  const toolRoutes = generateToolRoutes(projectRef, project, supabaseAIEnabled)
  const productRoutes = generateProductRoutes(projectRef, project, {
    auth: authEnabled,
    edgeFunctions: edgeFunctionsEnabled,
    storage: storageEnabled,
    realtime: realtimeEnabled && realtimeFlagEnabled,
  })
  const otherRoutes = generateOtherRoutes(projectRef, project)

  return (
    <div
      className={[
        'flex w-14 flex-col justify-between overflow-y-hidden p-2',
        'border-r bg-background border-default',
      ].join(' ')}
    >
      <ul className="flex flex-col space-y-2">
        {(!navLayoutV2 || !IS_PLATFORM) && (
          <Link href={IS_PLATFORM ? '/projects' : `/project/${projectRef}`} className="block">
            <img
              src={`${router.basePath}/img/supabase-logo.svg`}
              alt="Supabase"
              className="mx-auto h-[40px] w-6 cursor-pointer rounded"
            />
          </Link>
        )}
        <NavigationIconButton
          isActive={isUndefined(activeRoute) && !isUndefined(router.query.ref)}
          route={{
            key: 'HOME',
            label: 'Home',
            icon: <IconHome size={18} strokeWidth={2} />,
            link: `/project/${projectRef}`,
          }}
        />
        <div className="bg-border h-px w-full" />
        {toolRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
          />
        ))}
        <div className="bg-border h-px w-full"></div>

        {productRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
          />
        ))}
        <div className="h-px w-full bg-border"></div>
        {otherRoutes.map((route) => {
          if (route.key === 'api' && isNewAPIDocsEnabled) {
            return (
              <Tooltip.Root delayDuration={0} key={route.key}>
                <Tooltip.Trigger asChild>
                  <Button
                    type="text"
                    size="tiny"
                    onClick={() => snap.setShowProjectApiDocs(true)}
                    className="border-none group"
                  >
                    <div className="py-[7px]">
                      <IconFileText
                        size={18}
                        strokeWidth={2}
                        className="transition text-foreground-lighter group-hover:text-foreground"
                      />
                    </div>
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="right">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'bg-alternative shadow-lg shadow-background-surface-100	py-1.5 px-3 rounded leading-none', // background
                        'border border-default', //border
                      ].join(' ')}
                    >
                      <span className="text-foreground text-xs">Project API Docs</span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            )
          } else {
            return (
              <NavigationIconButton
                key={route.key}
                route={route}
                isActive={activeRoute === route.key}
              />
            )
          }
        })}
      </ul>
      {!navLayoutV2 && (
        <ul className="flex flex-col space-y-4 items-center">
          {IS_PLATFORM && (
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <Button
                  type="text"
                  size="tiny"
                  onClick={() => setIsOpen(true)}
                  className="border-none"
                >
                  <div className="py-1">
                    <IconSearch size={18} strokeWidth={2} className="text-foreground-lighter" />
                  </div>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="right" sideOffset={5}>
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'bg-alternative shadow-lg shadow-background-surface-100	py-1.5 px-3 rounded leading-none', // background
                      'border border-default', // border
                      'flex items-center gap-1', // layout
                    ].join(' ')}
                  >
                    {os === 'macos' ? (
                      <IconCommand size={11.5} strokeWidth={1.5} className="text-foreground" />
                    ) : (
                      <p className="text-xs">CTRL</p>
                    )}
                    <p className="text-xs">K</p>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button asChild type="text" size="tiny">
                <span className="py-1 h-10 border-none">
                  <IconUser size={18} strokeWidth={2} className="text-foreground-lighter" />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              {IS_PLATFORM && (
                <>
                  <DropdownMenuItem key="header" className="space-x-2" asChild>
                    <Link href="/account/me">
                      <IconSettings size={14} strokeWidth={1.5} />
                      <p>Account preferences</p>
                    </Link>
                  </DropdownMenuItem>
                  {showFeaturePreviews && (
                    <DropdownMenuItem
                      key="header"
                      className="space-x-2"
                      onClick={() => snap.setShowFeaturePreviewModal(true)}
                      onSelect={() => snap.setShowFeaturePreviewModal(true)}
                    >
                      <FlaskConical size={14} strokeWidth={2} />
                      <p>Feature previews</p>
                    </DropdownMenuItem>
                  )}
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
                  <DropdownMenuRadioItem value={'system'}>System</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={'dark'}>Dark</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={'light'}>Light</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </ul>
      )}
    </div>
  )
}

export default NavigationBar
