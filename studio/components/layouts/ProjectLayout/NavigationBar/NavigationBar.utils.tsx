import {
  IconArchive,
  IconBarChart,
  IconCode,
  IconDatabase,
  IconFileText,
  IconList,
  IconSettings,
  IconUsers,
} from 'ui'
import SVG from 'react-inlinesvg'

import { ProjectBase } from 'types'
import { Route } from 'components/ui/ui.types'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'

export const generateProductRoutes = (ref?: string, project?: ProjectBase): Route[] => {
  const isProjectBuilding = project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY
  const buildingUrl = `/project/${ref}/building`

  return [
    {
      key: 'editor',
      label: 'Table Editor',
      icon: (
        <SVG
          src="/img/table-editor.svg"
          style={{ width: `${18}px`, height: `${18}px` }}
          preProcessor={(code) => code.replace(/svg/, 'svg class="m-auto text-color-inherit"')}
        />
      ),
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/editor`),
    },
    {
      key: 'auth',
      label: 'Authentication',
      icon: <IconUsers size={18} strokeWidth={2} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/auth/users`),
    },
    ...(IS_PLATFORM
      ? [
          {
            key: 'storage',
            label: 'Storage',
            icon: <IconArchive size={18} strokeWidth={2} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/storage/buckets`),
          },
        ]
      : []),
    {
      key: 'sql',
      label: 'SQL Editor',
      icon: (
        <SVG
          src="/img/sql-editor.svg"
          style={{ width: `${18}px`, height: `${18}px` }}
          preProcessor={(code) => code.replace(/svg/, 'svg class="m-auto text-color-inherit"')}
        />
      ),
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/sql`),
    },
    {
      key: 'database',
      label: 'Database',
      icon: <IconDatabase size={18} strokeWidth={2} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/database/tables`),
    },
    ...(IS_PLATFORM
      ? [
          {
            key: 'functions',
            label: 'Edge Functions',
            icon: <IconCode size={18} strokeWidth={2} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/functions`),
          },
        ]
      : []),
  ]
}

export const generateOtherRoutes = (ref?: string, project?: ProjectBase): Route[] => {
  const isProjectBuilding = project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY
  const buildingUrl = `/project/${ref}/building`

  return [
    ...(IS_PLATFORM
      ? [
          {
            key: 'logs-explorer',
            label: 'Logs Explorer',
            icon: <IconList size={18} strokeWidth={2} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/logs-explorer`),
          },
        ]
      : []),
    ...(IS_PLATFORM
      ? [
          {
            key: 'reports',
            label: 'Reports',
            icon: <IconBarChart size={18} strokeWidth={2} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/reports`),
          },
        ]
      : []),
    {
      key: 'api',
      label: 'API',
      icon: <IconFileText size={18} strokeWidth={2} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/api`),
    },
    ...(IS_PLATFORM
      ? [
          {
            key: 'settings',
            label: 'Settings',
            icon: <IconSettings size={18} strokeWidth={2} />,
            link: ref && `/project/${ref}/settings/general`,
          },
        ]
      : []),
  ]
}
