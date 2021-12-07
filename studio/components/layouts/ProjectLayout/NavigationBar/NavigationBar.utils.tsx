import {
  IconUsers,
  IconFileText,
  IconArchive,
  IconSettings,
  IconDatabase,
  IconBarChart,
} from '@supabase/ui'
import SVG from 'react-inlinesvg'

import { IS_PLATFORM } from 'lib/constants'
import { Route } from 'components/ui/ui.types'

export const generateProductRoutes = (ref: string): Route[] => {
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
      link: `/project/${ref}/editor`,
    },
    {
      key: 'auth',
      label: 'Authentication',
      icon: <IconUsers size={18} strokeWidth={2} />,
      link: `/project/${ref}/auth/users`,
    },
    ...(IS_PLATFORM
      ? [
          {
            key: 'storage',
            label: 'Storage',
            icon: <IconArchive size={18} strokeWidth={2} />,
            link: `/project/${ref}/storage/buckets`,
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
      link: `/project/${ref}/sql`,
    },
    {
      key: 'database',
      label: 'Database',
      icon: <IconDatabase size={18} strokeWidth={2} />,
      link: `/project/${ref}/database/tables`,
    },
  ]
}

export const generateOtherRoutes = (ref: string) => {
  return [
    ...(IS_PLATFORM
      ? [
          {
            key: 'reports',
            label: 'Reports',
            icon: <IconBarChart size={18} strokeWidth={2} />,
            link: `/project/${ref}/reports`,
          },
        ]
      : []),
    {
      key: 'api',
      label: 'API',
      icon: <IconFileText size={18} strokeWidth={2} />,
      link: `/project/${ref}/api`,
    },
    ...(IS_PLATFORM
      ? [
          {
            key: 'settings',
            label: 'Settings',
            icon: <IconSettings size={18} strokeWidth={2} />,
            link: `/project/${ref}/settings/general`,
          },
        ]
      : []),
  ]
}
