import { Auth, Database, EdgeFunctions, Realtime, SqlEditor, Storage, TableEditor } from 'icons'
import { Blocks, Lightbulb, List, Settings, Telescope } from 'lucide-react'

import { ICON_SIZE, ICON_STROKE_WIDTH } from '@/components/interfaces/Sidebar'
import type { Route } from '@/components/ui/ui.types'
import { EditorIndexPageLink } from '@/data/prefetchers/project.$ref.editor'
import type { Project } from '@/data/projects/project-detail-query'
import { IS_PLATFORM, PROJECT_STATUS } from '@/lib/constants'

interface RouteContext {
  ref?: string
  isProjectActive: boolean
  isProjectBuilding: boolean
  buildingUrl: string
}

interface ProductFeatures {
  auth?: boolean
  edgeFunctions?: boolean
  storage?: boolean
  realtime?: boolean
  authOverviewPage?: boolean
}

interface OtherFeatures {
  isPlatform?: boolean
  unifiedLogs?: boolean
  showReports?: boolean
}

interface SettingsFeatures {
  isPlatform?: boolean
}

function getRouteContext(ref?: string, project?: Project): RouteContext {
  return {
    ref,
    isProjectActive: project?.status === PROJECT_STATUS.ACTIVE_HEALTHY,
    isProjectBuilding: project?.status === PROJECT_STATUS.COMING_UP,
    buildingUrl: `/project/${ref}`,
  }
}

export const generateToolRoutes = (ref?: string, project?: Project): Route[] => {
  const { isProjectActive, isProjectBuilding, buildingUrl } = getRouteContext(ref, project)

  return [
    {
      key: 'editor',
      label: 'Table Editor',
      disabled: !isProjectActive,
      icon: <TableEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/editor`),
      linkElement: <EditorIndexPageLink projectRef={ref} />,
    },
    {
      key: 'sql',
      label: 'SQL Editor',
      disabled: !isProjectActive,
      icon: <SqlEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/sql`),
    },
  ]
}

export const generateProductRoutes = (
  ref?: string,
  project?: Project,
  features?: ProductFeatures
): Route[] => {
  const { isProjectActive, isProjectBuilding, buildingUrl } = getRouteContext(ref, project)

  const authEnabled = features?.auth ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true
  const realtimeEnabled = features?.realtime ?? true
  const authOverviewPageEnabled = features?.authOverviewPage ?? false

  return [
    {
      key: 'database',
      label: 'Database',
      disabled: !isProjectActive,
      icon: <Database size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        ref &&
        (isProjectBuilding
          ? buildingUrl
          : isProjectActive
            ? `/project/${ref}/database/schemas`
            : `/project/${ref}/database/backups/scheduled`),
    },
    ...(authEnabled
      ? [
          {
            key: 'auth',
            label: 'Authentication',
            disabled: !isProjectActive,
            icon: <Auth size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              ref &&
              (isProjectBuilding
                ? buildingUrl
                : authOverviewPageEnabled
                  ? `/project/${ref}/auth/overview`
                  : `/project/${ref}/auth/users`),
          },
        ]
      : []),
    ...(storageEnabled
      ? [
          {
            key: 'storage',
            label: 'Storage',
            disabled: !isProjectActive,
            icon: <Storage size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/storage/files`),
          },
        ]
      : []),
    ...(edgeFunctionsEnabled
      ? [
          {
            key: 'functions',
            label: 'Edge Functions',
            disabled: false,
            icon: <EdgeFunctions size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && `/project/${ref}/functions`,
          },
        ]
      : []),
    ...(realtimeEnabled
      ? [
          {
            key: 'realtime',
            label: 'Realtime',
            disabled: !isProjectActive,
            icon: <Realtime size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/realtime/inspector`),
          },
        ]
      : []),
  ]
}

export const generateOtherRoutes = (
  ref?: string,
  project?: Project,
  features?: OtherFeatures
): Route[] => {
  const { isProjectActive, isProjectBuilding, buildingUrl } = getRouteContext(ref, project)

  const isPlatform = features?.isPlatform ?? IS_PLATFORM
  const unifiedLogsEnabled = features?.unifiedLogs ?? false
  const reportsEnabled = features?.showReports ?? true
  return [
    {
      key: 'advisors',
      label: 'Advisors',
      disabled: !isProjectActive,
      icon: <Lightbulb size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/advisors/security`),
    },
    // Observability is only available on the platform, not for self-hosted/CLI
    ...(isPlatform && reportsEnabled
      ? [
          {
            key: 'observability',
            label: 'Observability',
            disabled: !isProjectActive,
            icon: <Telescope size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/observability`),
          },
        ]
      : []),
    {
      key: 'logs',
      label: 'Logs',
      disabled: false,
      icon: <List size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (unifiedLogsEnabled ? `/project/${ref}/logs` : `/project/${ref}/logs/explorer`),
    },
    {
      key: 'integrations',
      label: 'Integrations',
      disabled: !isProjectActive,
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/integrations`),
    },
  ]
}

export const generateSettingsRoutes = (ref?: string, features?: SettingsFeatures): Route[] => {
  const isPlatform = features?.isPlatform ?? IS_PLATFORM

  return [
    {
      key: 'settings',
      label: 'Project Settings',
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        ref &&
        (isPlatform ? `/project/${ref}/settings/general` : `/project/${ref}/settings/log-drains`),
      disabled: false,
    },
  ]
}
