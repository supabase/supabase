import * as Tooltip from '@radix-ui/react-tooltip'
import { useParams } from 'common'
import { useFlag } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { detectOS } from 'lib/helpers'
import { isUndefined } from 'lodash'
import { FlaskConical } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Button,
  DropdownMenuContent_Shadcn_,
  DropdownMenuGroup_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuLabel_Shadcn_,
  DropdownMenuRadioGroup_Shadcn_,
  DropdownMenuRadioItem_Shadcn_,
  DropdownMenuSeparator_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconCommand,
  IconHome,
  IconSearch,
  IconSettings,
  IconUser,
  useCommandMenu,
} from 'ui'
import { useProjectContext } from '../ProjectContext'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateToolRoutes,
} from './NavigationBar.utils'
import NavigationIconButton from './NavigationIconButton'

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

  const activeRoute = router.pathname.split('/')[3]
  const toolRoutes = generateToolRoutes(projectRef, project, supabaseAIEnabled)
  const productRoutes = generateProductRoutes(projectRef, project)
  const otherRoutes = generateOtherRoutes(projectRef, project)

  return (
    <div
      className={[
        'flex w-14 flex-col justify-between overflow-y-hidden p-2',
        'border-r bg-body border-scale-500',
      ].join(' ')}
    >
      <ul className="flex flex-col space-y-2">
        {(!navLayoutV2 || !IS_PLATFORM) && (
          <Link href={IS_PLATFORM ? '/projects' : `/project/${projectRef}`}>
            <a className="block">
              <img
                src={`${router.basePath}/img/supabase-logo.svg`}
                alt="Supabase"
                className="mx-auto h-[40px] w-6 cursor-pointer rounded"
              />
            </a>
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
        <div className="bg-scale-500 h-px w-full" />
        {toolRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
          />
        ))}
        <div className="bg-scale-500 h-px w-full"></div>

        {productRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
          />
        ))}
        <div className="h-px w-full bg-scale-500"></div>
        {otherRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
          />
        ))}
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
                <Tooltip.Content side="right">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded  py-1 px-2 leading-none shadow',
                      'border border-scale-200 flex items-center space-x-1',
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
          <DropdownMenu_Shadcn_>
            <DropdownMenuTrigger_Shadcn_>
              <Button asChild type="text" size="tiny">
                <span className="py-1 h-10 border-none">
                  <IconUser size={18} strokeWidth={2} className="text-foreground-lighter" />
                </span>
              </Button>
            </DropdownMenuTrigger_Shadcn_>
            <DropdownMenuContent_Shadcn_ side="right" align="start">
              {IS_PLATFORM && (
                <>
                  <Link href="/account/me">
                    <DropdownMenuItem_Shadcn_ key="header" className="space-x-2">
                      <IconSettings size={14} strokeWidth={1.5} />
                      <p>Account preferences</p>
                    </DropdownMenuItem_Shadcn_>
                  </Link>
                  {showFeaturePreviews && (
                    <DropdownMenuItem_Shadcn_
                      key="header"
                      className="space-x-2"
                      onClick={() => snap.setShowFeaturePreviewModal(true)}
                      onSelect={() => snap.setShowFeaturePreviewModal(true)}
                    >
                      <FlaskConical size={14} strokeWidth={2} />
                      <p className="text">Feature previews</p>
                    </DropdownMenuItem_Shadcn_>
                  )}
                  <DropdownMenuSeparator_Shadcn_ />
                </>
              )}
              <DropdownMenuLabel_Shadcn_>Theme</DropdownMenuLabel_Shadcn_>
              <DropdownMenuGroup_Shadcn_>
                <DropdownMenuRadioGroup_Shadcn_
                  value={theme}
                  onValueChange={(value) => {
                    setTheme(value)
                  }}
                >
                  <DropdownMenuRadioItem_Shadcn_ value={'system'}>
                    System
                  </DropdownMenuRadioItem_Shadcn_>
                  <DropdownMenuRadioItem_Shadcn_ value={'dark'}>Dark</DropdownMenuRadioItem_Shadcn_>
                  <DropdownMenuRadioItem_Shadcn_ value={'light'}>
                    Light
                  </DropdownMenuRadioItem_Shadcn_>
                </DropdownMenuRadioGroup_Shadcn_>
              </DropdownMenuGroup_Shadcn_>
            </DropdownMenuContent_Shadcn_>
          </DropdownMenu_Shadcn_>
        </ul>
      )}
    </div>
  )
}

export default NavigationBar
