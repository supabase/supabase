import React from 'react'
import {
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
} from './HomeMenuIcons'

function getMenuIcon(menuKey: string, width: number = 16, height: number = 16) {
  switch (menuKey) {
    case 'home':
      return <IconMenuHome width={width} height={height} />
    case 'getting-started':
      return <IconMenuGettingStarted width={width} height={height} />
    case 'database':
      return <IconMenuDatabase width={width} height={height} />
    case 'rest':
      return <IconMenuRestApis width={width} height={height} />
    case 'graphql':
      return <IconMenuGraphQL width={width} height={height} />
    case 'auth':
      return <IconMenuAuth width={width} height={height} />
    case 'edge-functions':
      return <IconMenuEdgeFunctions width={width} height={height} />
    case 'realtime':
      return <IconMenuRealtime width={width} height={height} />
    case 'storage':
      return <IconMenuStorage width={width} height={height} />
    case 'ai':
      return <IconMenuAI width={width} height={height} />
    case 'platform':
      return <IconMenuPlatform width={width} height={height} />
    case 'resources':
      return <IconMenuResources width={width} height={height} />
    case 'self-hosting':
      return <IconMenuSelfHosting width={width} height={height} />
    case 'integrations':
      return <IconMenuIntegrations width={width} height={height} />
    case 'reference-javascript':
      return <IconMenuJavascript width={width} height={height} />
    case 'reference-dart':
      return <IconMenuFlutter width={width} height={height} />
    case 'reference-python':
      return <IconMenuPython width={width} height={height} />
    case 'reference-csharp':
      return <IconMenuCsharp width={width} height={height} />
    case 'reference-swift':
      return <IconMenuSwift width={width} height={height} />
    case 'reference-kotlin':
      return <IconMenuKotlin width={width} height={height} />
    case 'reference-api':
      return <IconMenuApi width={width} height={height} />
    case 'dev-cli':
      return <IconMenuDevCli width={width} height={height} />
    case 'reference-cli':
      return <IconMenuCli width={width} height={height} />
    case 'status':
      return <IconMenuStatus width={width} height={height} />
    default:
      return <IconMenuPlatform width={width} height={height} />
  }
}

type HomeMenuIconPickerProps = {
  icon: string
  width?: number
  height?: number
}

export default function HomeMenuIconPicker({
  icon,
  width = 16,
  height = 16,
}: HomeMenuIconPickerProps) {
  return getMenuIcon(icon, width, height)
}
