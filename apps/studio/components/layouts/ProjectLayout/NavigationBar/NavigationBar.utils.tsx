import { Blocks, FileText, Lightbulb, List, Settings } from 'lucide-react'

import { ICON_SIZE, ICON_STROKE_WIDTH } from 'components/interfaces/Sidebar'
import { generateAuthMenu } from 'components/layouts/AuthLayout/AuthLayout.utils'
import { generateDatabaseMenu } from 'components/layouts/DatabaseLayout/DatabaseMenu.utils'
import { generateSettingsMenu } from 'components/layouts/ProjectSettingsLayout/SettingsMenu.utils'
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

export const generateToolRoutes = (
  slug: string,
  ref?: string,
  project?: Project,
  features?: {}
): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/org/[slug]/project/${ref}`

  return [
    {
      key: 'editor',
      label: 'Table Editor',
      icon: <TableEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/editor`),
      linkElement: <EditorIndexPageLink slug={slug} projectRef={ref} />,
    },
    {
      key: 'sql',
      label: 'SQL Editor',
      icon: <SqlEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: !IS_PLATFORM
        ? `/org/${slug}/project/${ref}/sql/1`
        : ref && (isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/sql`),
    },
  ]
}
export const generateProductRoutes = (
  slug: string,
  ref?: string,
  project?: Project,
  features?: { auth?: boolean; edgeFunctions?: boolean; storage?: boolean; realtime?: boolean }
): Route[] => {
  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/org/${slug}/project/${ref}`

  const authEnabled = features?.auth ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true
  const realtimeEnabled = features?.realtime ?? true

  const databaseMenu = generateDatabaseMenu(slug, project)
  const authMenu = generateAuthMenu(slug, ref as string)

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
            ? `/org/${slug}/project/${ref}/database/schemas`
            : `/org/${slug}/project/${ref}/database/backups/scheduled`),
      items: databaseMenu,
    },
    ...(authEnabled
      ? [
          {
            key: 'auth',
            label: 'Authentication',
            icon: <Auth size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              ref && (isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/auth/users`),
            items: authMenu,
          },
        ]
      : []),
    ...(storageEnabled
      ? [
          {
            key: 'storage',
            label: 'Storage',
            icon: <Storage size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              ref &&
              (isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/storage/buckets`),
          },
        ]
      : []),
    ...(edgeFunctionsEnabled
      ? [
          {
            key: 'functions',
            label: 'Edge Functions',
            icon: <EdgeFunctions size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              ref && (isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/functions`),
          },
        ]
      : []),
    ...(realtimeEnabled
      ? [
          {
            key: 'realtime',
            label: 'Realtime',
            icon: <Realtime size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              ref &&
              (isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/realtime/inspector`),
          },
        ]
      : []),
  ]
}

export const generateOtherRoutes = (
  slug: string,
  ref?: string,
  project?: Project,
  features?: { unifiedLogs?: boolean }
): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/org/${slug}/project/${ref}`

  const unifiedLogsEnabled = features?.unifiedLogs ?? false

  return [
    {
      key: 'advisors',
      label: 'Advisors',
      icon: <Lightbulb size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        ref && (isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/advisors/security`),
    },
    {
      key: 'logs',
      label: 'Logs',
      icon: <List size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        ref &&
        (isProjectBuilding
          ? buildingUrl
          : unifiedLogsEnabled
            ? `/org/${slug}/project/${ref}/logs`
            : `/org/${slug}/project/${ref}/logs/explorer`),
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: <Reports size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/reports`),
    },

    // {
    //   key: 'logs',
    //   label: 'Logs',
    //   icon: <List size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    //   link: ref && (isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/logs`),
    // },
    {
      key: 'api',
      label: 'API Docs',
      icon: <FileText size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/api`),
    },
    {
      key: 'integrations',
      label: 'Integrations',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/integrations`),
    },
        {
      label: 'project settings',
      link: `/org/${slug}/general`,
      key: 'settings',
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
  ]
}

export const generateSettingsRoutes = (slug: string, ref?: string, project?: Project): Route[] => {
  const settingsMenu = generateSettingsMenu(slug, ref as string)
  return [
    ...(IS_PLATFORM
      ? [
          {
            key: 'settings',
            label: 'Project Settings',
            icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && `/org/${slug}/project/${ref}/settings/general`,
            items: settingsMenu,
          },
        ]
      : []),
  ]
}
