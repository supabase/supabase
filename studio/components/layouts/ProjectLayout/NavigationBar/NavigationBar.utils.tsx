import SVG from 'react-inlinesvg'
import { products } from 'shared-data'
import { IconBarChart, IconFileText, IconList, IconSettings } from 'ui'

import { Route } from 'components/ui/ui.types'
import { BASE_PATH, IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { ProjectBase } from 'types'

export const generateToolRoutes = (
  ref?: string,
  project?: ProjectBase,
  supabaseAIEnabled?: boolean
): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}/building`

  return [
    {
      key: 'editor',
      label: 'Table Editor',
      icon: (
        <SVG
          src={`${BASE_PATH}/img/table-editor.svg`}
          style={{ width: `${18}px`, height: `${18}px` }}
          preProcessor={(code) => code.replace(/svg/, 'svg class="m-auto text-color-inherit"')}
        />
      ),
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/editor`),
    },
    {
      key: 'sql',
      label: 'SQL Editor',
      icon: (
        <SVG
          src={`${BASE_PATH}/img/sql-editor.svg`}
          style={{ width: `${18}px`, height: `${18}px`, strokeWidth: `4` }}
          preProcessor={(code) => code.replace(/svg/, 'svg class="m-auto text-color-inherit"')}
        />
      ),
      link: !IS_PLATFORM
        ? `/project/${ref}/sql/1`
        : ref &&
          (isProjectBuilding
            ? buildingUrl
            : supabaseAIEnabled
            ? `/project/${ref}/sql/new`
            : `/project/${ref}/sql/templates`),
    },
  ]
}
export const generateProductRoutes = (
  ref?: string,
  project?: ProjectBase,
  features?: { auth?: boolean; edgeFunctions?: boolean; storage?: boolean; realtime?: boolean }
): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}/building`

  const authEnabled = features?.auth ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true
  const realtimeEnabled = features?.realtime ?? true

  return [
    {
      key: 'database',
      label: 'Database',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={products.database.icon[18]}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/database/tables`),
    },
    ...(authEnabled
      ? [
          {
            key: 'auth',
            label: 'Authentication',
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d={products.authentication.icon[24]}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/auth/users`),
          },
        ]
      : []),
    ...(storageEnabled
      ? [
          {
            key: 'storage',
            label: 'Storage',
            icon: (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d={products.storage.icon[18]}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/storage/buckets`),
          },
        ]
      : []),
    ...(IS_PLATFORM && edgeFunctionsEnabled
      ? [
          {
            key: 'functions',
            label: 'Edge Functions',
            icon: (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d={products.functions.icon[18]}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/functions`),
          },
        ]
      : []),
    ...(IS_PLATFORM && realtimeEnabled
      ? [
          {
            key: 'realtime',
            label: 'Realtime',
            icon: (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d={products.realtime.icon[18]}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/realtime/inspector`),
          },
        ]
      : []),
  ]
}

export const generateOtherRoutes = (ref?: string, project?: ProjectBase): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}/building`

  return [
    ...(IS_PLATFORM
      ? [
          {
            key: 'reports',
            label: 'Reports',
            icon: <IconBarChart size={18} strokeWidth={2.5} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/reports`),
          },
        ]
      : []),
    {
      key: 'logs',
      label: 'Logs',
      icon: <IconList size={18} strokeWidth={2.5} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/logs/explorer`),
    },
    {
      key: 'api',
      label: 'API Docs',
      icon: <IconFileText size={18} strokeWidth={2} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/api`),
    },
    ...(IS_PLATFORM
      ? [
          {
            key: 'settings',
            label: 'Project Settings',
            icon: <IconSettings size={18} strokeWidth={2.5} />,
            link: ref && `/project/${ref}/settings/general`,
          },
        ]
      : []),
  ]
}
