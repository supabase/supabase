import {
  IconArchive,
  IconBarChart,
  IconCode,
  IconDatabase,
  IconFileText,
  IconList,
  IconSettings,
  IconUsers,
} from '@supabase/ui'
import SVG from 'react-inlinesvg'

import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { Route } from 'components/ui/ui.types'

import { useFlag, usePermissions } from 'hooks'
import { ProjectBase } from 'types'
import { PermissionAction } from '@supabase/shared-types/out/constants'

export const generateProductRoutes = (ref: string, project?: ProjectBase): Route[] => {
  const functionsUi = useFlag('functionsUi')
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
      link: isProjectBuilding ? buildingUrl : `/project/${ref}/editor`,
      hidden: !usePermissions(PermissionAction.SQL_SELECT, 'postgres.public'),
    },
    {
      key: 'auth',
      label: 'Authentication',
      icon: <IconUsers size={18} strokeWidth={2} />,
      link: isProjectBuilding ? buildingUrl : `/project/${ref}/auth/users`,
    },
    {
      key: 'storage',
      label: 'Storage',
      icon: <IconArchive size={18} strokeWidth={2} />,
      link: isProjectBuilding ? buildingUrl : `/project/${ref}/storage/buckets`,
      hidden: !IS_PLATFORM,
    },
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
      link: isProjectBuilding ? buildingUrl : `/project/${ref}/sql`,
    },
    {
      key: 'database',
      label: 'Database',
      icon: <IconDatabase size={18} strokeWidth={2} />,
      link: isProjectBuilding ? buildingUrl : `/project/${ref}/database/tables`,
    },
    {
      key: 'functions',
      label: 'Functions',
      icon: <IconCode size={18} strokeWidth={2} />,
      link: isProjectBuilding ? buildingUrl : `/project/${ref}/functions`,
      hidden: !IS_PLATFORM || !functionsUi,
    },
  ]
}

export const generateOtherRoutes = (ref: string, project?: ProjectBase): Route[] => {
  const isProjectBuilding = project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY
  const buildingUrl = `/project/${ref}/building`

  const canReadStats = usePermissions(
    PermissionAction.SQL_SELECT,
    'postgres.public.stats_daily_projects',
    {
      resource: { type: 'report' },
    }
  )
  const canReadReport = usePermissions(
    PermissionAction.SQL_SELECT,
    'postgres.public.user_content',
    {
      resource: { type: 'report' },
    }
  )

  return [
    {
      key: 'logs-explorer',
      label: 'Logs Explorer',
      icon: <IconList size={18} strokeWidth={2} />,
      link: isProjectBuilding ? buildingUrl : `/project/${ref}/logs-explorer`,
      hidden: !IS_PLATFORM,
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: <IconBarChart size={18} strokeWidth={2} />,
      link: isProjectBuilding ? buildingUrl : `/project/${ref}/reports`,
      hidden: !IS_PLATFORM || !canReadReport || !canReadStats,
    },
    {
      key: 'api',
      label: 'API',
      icon: <IconFileText size={18} strokeWidth={2} />,
      link: isProjectBuilding ? buildingUrl : `/project/${ref}/api`,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <IconSettings size={18} strokeWidth={2} />,
      link: `/project/${ref}/settings/general`,
      hidden:
        !IS_PLATFORM || !usePermissions(PermissionAction.SQL_SELECT, 'postgres.public.projects'),
    },
  ]
}
