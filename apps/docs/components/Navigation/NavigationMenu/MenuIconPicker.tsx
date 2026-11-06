import {
  Boxes,
  CircleChevronRight,
  Clock,
  Hammer,
  Heart,
  Lock,
  MousePointerClick,
  Rocket,
  ScrollText,
  Server,
  Settings2,
  SquareStack,
  Telescope,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from 'ui'

import {
  IconBranching,
  IconGitBranch,
  IconGitHub,
  IconMenuAI,
  IconMenuApi,
  IconMenuAuth,
  IconMenuCli,
  IconMenuCsharp,
  IconMenuDatabase,
  IconMenuDevCli,
  IconMenuEdgeFunctions,
  IconMenuFlutter,
  IconMenuGettingStarted,
  IconMenuGraphQL,
  IconMenuHome,
  IconMenuIntegrations,
  IconMenuJavascript,
  IconMenuKotlin,
  IconMenuPlatform,
  IconMenuPython,
  IconMenuRealtime,
  IconMenuResources,
  IconMenuRestApis,
  IconMenuSelfHosting,
  IconMenuStatus,
  IconMenuStorage,
  IconMenuSwift,
  IconSecurity,
  IconSupport,
  IconUI,
} from './MenuIcons'

interface MenuIconProps {
  width: number
  height: number
  className?: string
}

interface LayoutIconProps extends MenuIconProps {
  legacy: ComponentType<MenuIconProps>
  icon: ComponentType<MenuIconProps>
}

// the legacy icon shows while the docs-layout-v2 flag is off
const LayoutIcon = ({ legacy: LegacyIcon, icon: Icon, className, ...size }: LayoutIconProps) => (
  <>
    <LegacyIcon {...size} className={cn(className, 'layout-v2:hidden')} />
    <Icon {...size} className={cn(className, 'hidden layout-v2:block')} />
  </>
)

function getMenuIcon(menuKey: string, width: number = 16, height: number = 16, className?: string) {
  switch (menuKey) {
    case 'home':
      return <IconMenuHome width={width} height={height} className={className} />
    case 'branching':
      return <IconBranching width={width} height={height} className={className} />
    case 'getting-started':
      return (
        <LayoutIcon
          legacy={IconMenuGettingStarted}
          icon={CircleChevronRight}
          width={width}
          height={height}
          className={className}
        />
      )
    case 'database':
      return <IconMenuDatabase width={width} height={height} className={className} />
    case 'rest':
      return <IconMenuRestApis width={width} height={height} className={className} />
    case 'graphql':
      return <IconMenuGraphQL width={width} height={height} className={className} />
    case 'auth':
      return (
        <LayoutIcon
          legacy={IconMenuAuth}
          icon={Lock}
          width={width}
          height={height}
          className={className}
        />
      )
    case 'edge-functions':
      return <IconMenuEdgeFunctions width={width} height={height} className={className} />
    case 'realtime':
      return (
        <LayoutIcon
          legacy={IconMenuRealtime}
          icon={MousePointerClick}
          width={width}
          height={height}
          className={className}
        />
      )
    case 'storage':
      return <IconMenuStorage width={width} height={height} className={className} />
    case 'ai':
      return <IconMenuAI width={width} height={height} className={className} />
    case 'platform':
      return <IconMenuPlatform width={width} height={height} className={className} />
    case 'resources':
      return <IconMenuResources width={width} height={height} className={className} />
    case 'self-hosting':
      return <IconMenuSelfHosting width={width} height={height} className={className} />
    case 'integrations':
      return <IconMenuIntegrations width={width} height={height} className={className} />
    case 'reference-javascript':
      return <IconMenuJavascript width={width} height={height} className={className} />
    case 'reference-dart':
      return <IconMenuFlutter width={width} height={height} className={className} />
    case 'reference-python':
      return <IconMenuPython width={width} height={height} className={className} />
    case 'reference-csharp':
      return <IconMenuCsharp width={width} height={height} className={className} />
    case 'reference-swift':
      return <IconMenuSwift width={width} height={height} className={className} />
    case 'reference-kotlin':
      return <IconMenuKotlin width={width} height={height} className={className} />
    case 'reference-api':
      return <IconMenuApi width={width} height={height} className={className} />
    case 'dev-cli':
      return <IconMenuDevCli width={width} height={height} className={className} />
    case 'reference-cli':
      return <IconMenuCli width={width} height={height} className={className} />
    case 'status':
      return <IconMenuStatus width={width} height={height} className={className} />
    case 'git-branch':
      return <IconGitBranch width={width} height={height} className={className} />
    case 'github':
      return <IconGitHub width={width} height={height} className={className} />
    case 'support':
      return <IconSupport width={width} height={height} className={className} />
    case 'security':
      return <IconSecurity width={width} height={height} className={className} />
    case 'telemetry':
      return <Telescope width={width} height={height} className={className} />
    case 'changelog':
      return <ScrollText width={width} height={height} className={className} />
    case 'contributing':
      return <Heart width={width} height={height} className={className} />
    case 'deployment':
      return <Server width={width} height={height} className={className} />
    case 'cron':
      return <Clock width={width} height={height} className={className} />
    case 'queues':
      return <SquareStack width={width} height={height} className={className} />
    case 'ui':
      return <IconUI width={width} height={height} className={className} />
    case 'products':
      return <Boxes width={width} height={height} className={className} />
    case 'build':
      return <Hammer width={width} height={height} className={className} />
    case 'develop':
      return <Rocket width={width} height={height} className={className} />
    case 'manage':
      return <Settings2 width={width} height={height} className={className} />
    default:
      return <IconMenuPlatform width={width} height={height} className={className} />
  }
}

type MenuIconPickerProps = {
  icon: string
  width?: number
  height?: number
  className?: string
}

export default function MenuIconPicker({
  icon,
  width = 16,
  height = 16,
  className,
}: MenuIconPickerProps) {
  return getMenuIcon(icon, width, height, className)
}
