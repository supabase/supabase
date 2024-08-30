import {
  IconBranching,
  IconGitHub,
  IconMenuApi,
  IconMenuAuth,
  IconMenuCli,
  IconMenuCsharp,
  IconMenuDatabase,
  IconMenuGraphQL,
  IconMenuEdgeFunctions,
  IconMenuFlutter,
  IconMenuGettingStarted,
  IconMenuHome,
  IconMenuIntegrations,
  IconMenuJavascript,
  IconMenuPlatform,
  IconMenuPython,
  IconMenuRealtime,
  IconMenuResources,
  IconMenuSelfHosting,
  IconMenuRestApis,
  IconMenuStorage,
  IconMenuSwift,
  IconMenuStatus,
  IconMenuKotlin,
  IconMenuAI,
  IconMenuDevCli,
  IconSupport,
  IconTroubleshooting,
} from './MenuIcons'

function getMenuIcon(menuKey: string, width: number = 16, height: number = 16, className?: string) {
  switch (menuKey) {
    case 'home':
      return <IconMenuHome width={width} height={height} className={className} />
    case 'branching':
      return <IconBranching width={width} height={height} className={className} />
    case 'getting-started':
      return <IconMenuGettingStarted width={width} height={height} className={className} />
    case 'database':
      return <IconMenuDatabase width={width} height={height} className={className} />
    case 'rest':
      return <IconMenuRestApis width={width} height={height} className={className} />
    case 'graphql':
      return <IconMenuGraphQL width={width} height={height} className={className} />
    case 'auth':
      return <IconMenuAuth width={width} height={height} className={className} />
    case 'edge-functions':
      return <IconMenuEdgeFunctions width={width} height={height} className={className} />
    case 'realtime':
      return <IconMenuRealtime width={width} height={height} className={className} />
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
    case 'github':
      return <IconGitHub width={width} height={height} className={className} />
    case 'support':
      return <IconSupport width={width} height={height} className={className} />
    case 'contributing':
      return <IconTroubleshooting width={width} height={height} className={className} />
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
