import { Blocks, FileText, Lightbulb, List, Settings, Telescope } from 'lucide-react'

import { ICON_SIZE, ICON_STROKE_WIDTH } from 'components/interfaces/Sidebar'
import { generateAuthMenu } from 'components/layouts/AuthLayout/AuthLayout.utils'
import { generateDatabaseMenu } from 'components/layouts/DatabaseLayout/DatabaseMenu.utils'
import { generateSettingsMenu } from 'components/layouts/ProjectSettingsLayout/SettingsMenu.utils'
import type { Route } from 'components/ui/ui.types'
import { EditorIndexPageLink } from 'data/prefetchers/project.$ref.editor'
import type { Project } from 'data/projects/project-detail-query'
import { Auth, Database, EdgeFunctions, Realtime, SqlEditor, Storage, TableEditor } from 'icons'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'

// Helper to safely build project URLs when ref might be undefined
const projectUrl = (ref: string | undefined, path: string) => (ref ? `/project/${ref}/${path}` : '')

export const generateToolRoutes = (ref?: string, project?: Project, features?: {}): Route[] => {
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
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/sql`),
    },
  ]
}

export const generateProductRoutes = (
  ref?: string,
  project?: Project,
  features?: {
    auth?: boolean
    edgeFunctions?: boolean
    storage?: boolean
    realtime?: boolean
    authOverviewPage?: boolean
  }
): Route[] => {
  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  const authEnabled = features?.auth ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true
  const realtimeEnabled = features?.realtime ?? true
  const authOverviewPageEnabled = features?.authOverviewPage ?? false

  const databaseMenu = generateDatabaseMenu(project)
  const authMenu = generateAuthMenu(ref as string)

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
      items: databaseMenu,
    },
    ...(authEnabled
      ? [
          {
            key: 'auth',
            label: 'Authentication',
            icon: <Auth size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              ref &&
              (isProjectBuilding
                ? buildingUrl
                : authOverviewPageEnabled
                  ? `/project/${ref}/auth/overview`
                  : `/project/${ref}/auth/users`),
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
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/storage/files`),
            items: [
              {
                title: 'Storage',
                items: [
                  { name: 'Files', key: 'files', url: projectUrl(ref, 'storage/files'), items: [] },
                  {
                    name: 'Analytics',
                    key: 'analytics',
                    url: projectUrl(ref, 'storage/analytics'),
                    items: [],
                  },
                  {
                    name: 'Vectors',
                    key: 'vectors',
                    url: projectUrl(ref, 'storage/vectors'),
                    items: [],
                  },
                  {
                    name: 'S3 Access',
                    key: 's3',
                    url: projectUrl(ref, 'storage/s3'),
                    items: [],
                  },
                  {
                    name: 'Settings',
                    key: 'settings',
                    url: projectUrl(ref, 'storage/settings'),
                    items: [],
                  },
                ],
              },
            ],
          },
        ]
      : []),
    ...(edgeFunctionsEnabled
      ? [
          {
            key: 'functions',
            label: 'Edge Functions',
            icon: <EdgeFunctions size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/functions`),
            items: [
              {
                title: 'Edge Functions',
                items: [
                  {
                    name: 'Functions',
                    key: 'main',
                    pages: ['', 'new'],
                    url: projectUrl(ref, 'functions'),
                    items: [],
                  },
                  {
                    name: 'Secrets',
                    key: 'secrets',
                    url: projectUrl(ref, 'functions/secrets'),
                    items: [],
                  },
                ],
              },
            ],
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
            items: [
              {
                title: 'Realtime',
                items: [
                  {
                    name: 'Inspector',
                    key: 'inspector',
                    url: projectUrl(ref, 'realtime/inspector'),
                    items: [],
                  },
                  {
                    name: 'Quotas',
                    key: 'quotas',
                    url: projectUrl(ref, 'realtime/quotas'),
                    items: [],
                  },
                ],
              },
            ],
          },
        ]
      : []),
  ]
}

export const generateOtherRoutes = (
  ref?: string,
  project?: Project,
  features?: { unifiedLogs?: boolean; showReports?: boolean }
): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  const { unifiedLogs, showReports } = features ?? {}
  const unifiedLogsEnabled = unifiedLogs ?? false
  const reportsEnabled = showReports ?? true

  return [
    {
      key: 'advisors',
      label: 'Advisors',
      icon: <Lightbulb size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/advisors/security`),
      items: [
        {
          title: 'Advisors',
          items: [
            {
              name: 'Security',
              key: 'security',
              url: projectUrl(ref, 'advisors/security'),
              items: [],
            },
            {
              name: 'Performance',
              key: 'performance',
              url: projectUrl(ref, 'advisors/performance'),
              items: [],
            },
          ],
        },
      ],
    },
    ...(IS_PLATFORM && reportsEnabled
      ? [
          {
            key: 'observability',
            label: 'Observability',
            icon: <Telescope size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/observability`),
          },
        ]
      : []),
    {
      key: 'logs',
      label: 'Logs',
      icon: <List size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        ref &&
        (isProjectBuilding
          ? buildingUrl
          : unifiedLogsEnabled
            ? `/project/${ref}/logs`
            : `/project/${ref}/logs/explorer`),
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
  const settingsMenu = generateSettingsMenu(ref as string)
  return [
    {
      key: 'settings',
      label: 'Project Settings',
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        ref &&
        (IS_PLATFORM ? `/project/${ref}/settings/general` : `/project/${ref}/settings/log-drains`),
      items: settingsMenu,
    },
  ]
}
