import { Blocks, FileText, Lightbulb, List, Settings } from 'lucide-react'

import type { Route } from 'components/ui/ui.types'
import { EditorIndexPageLink } from 'data/prefetchers/project.$ref.editor'
import type { Project } from 'data/projects/project-detail-query'
import {
  Auth,
  Database,
  EdgeFunctions,
  Realtime,
  Reports,
  SqlEditor,
  Storage,
  TableEditor,
} from 'icons'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { ICON_SIZE, ICON_STROKE_WIDTH } from 'components/interfaces/Sidebar'

export const generateToolRoutes = (ref?: string, project?: Project): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  return [
    {
      key: 'editor',
      label: 'Table Editor',
      icon: <TableEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/editor`),
      linkElement: <EditorIndexPageLink projectRef={ref} />,
    },
    {
      key: 'sql',
      label: 'SQL Editor',
      icon: <SqlEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: !IS_PLATFORM
        ? `/project/${ref}/sql/1`
        : ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/sql/new`),
    },
  ]
}
export const generateProductRoutes = (
  ref?: string,
  project?: Project,
  features?: { auth?: boolean; edgeFunctions?: boolean; storage?: boolean; realtime?: boolean }
): Route[] => {
  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  const authEnabled = features?.auth ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true
  const realtimeEnabled = features?.realtime ?? true

  return [
    {
      key: 'database',
      label: 'Database',
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
            icon: <Auth size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/auth/users`),
          },
        ]
      : []),
    ...(storageEnabled
      ? [
          {
            key: 'storage',
            label: 'Storage',
            icon: <Storage size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/storage/buckets`),
          },
        ]
      : []),
    ...(IS_PLATFORM && edgeFunctionsEnabled
      ? [
          {
            key: 'functions',
            label: 'Edge Functions',
            icon: <EdgeFunctions size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/functions`),
          },
        ]
      : []),
    ...(realtimeEnabled
      ? [
          {
            key: 'realtime',
            label: 'Realtime',
            icon: <Realtime size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/realtime/inspector`),
          },
        ]
      : []),
  ]
}

export const generateOtherRoutes = (ref?: string, project?: Project): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  return [
    {
      key: 'advisors',
      label: 'Advisors',
      icon: <Lightbulb size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/advisors/security`),
    },
    ...(IS_PLATFORM
      ? [
          {
            key: 'reports',
            label: 'Reports',
            icon: <Reports size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/reports`),
          },
        ]
      : []),
    {
      key: 'logs',
      label: 'Logs',
      icon: <List size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/logs`),
    },
    {
      key: 'api',
      label: 'API Docs',
      icon: <FileText size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/api`),
    },
    {
      key: 'integrations',
      label: 'Integrations',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/integrations`),
    },
  ]
}

export const generateSettingsRoutes = (ref?: string, project?: Project): Route[] => {
  return [
    ...(IS_PLATFORM
      ? [
          {
            key: 'settings',
            label: 'Project Settings',
            icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && `/project/${ref}/settings/general`,
          },
        ]
      : []),
  ]
}
