import React from 'react'
import {
  IconMenuApi,
  IconMenuAuth,
  IconMenuCli,
  IconMenuCsharp,
  IconMenuDatabase,
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
  IconMenuServerlessApis,
  IconMenuStorage,
  IconMenuSwift,
} from './HomeMenuIcons'

function getMenuIcon(menuKey: string) {
  switch (menuKey) {
    case 'home':
      return <IconMenuHome />
    case 'getting-started':
      return <IconMenuGettingStarted />
    case 'database':
      return <IconMenuDatabase />
    case 'serverless-apis':
      return <IconMenuServerlessApis />
    case 'auth':
      return <IconMenuAuth />
    case 'edge-functions':
      return <IconMenuEdgeFunctions />
    case 'realtime':
      return <IconMenuRealtime />
    case 'storage':
      return <IconMenuStorage />
    case 'platform':
      return <IconMenuPlatform />
    case 'resources':
      return <IconMenuResources />
    case 'self-hosting':
      return <IconMenuSelfHosting />
    case 'integrations':
      return <IconMenuIntegrations />
    case 'javascript':
      return <IconMenuJavascript />
    case 'dart':
      return <IconMenuFlutter />
    case 'python':
      return <IconMenuPython />
    case 'csharp':
      return <IconMenuCsharp />
    case 'swift':
      return <IconMenuSwift />
    case 'api':
      return <IconMenuApi />
    case 'cli':
      return <IconMenuCli />
    default:
      return <IconMenuPlatform />
  }
}

type HomeMenuIconPickerProps = {
  icon: string
}

export default function HomeMenuIconPicker({ icon }: HomeMenuIconPickerProps) {
  return getMenuIcon(icon)
}
