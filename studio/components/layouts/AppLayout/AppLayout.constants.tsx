import { IconBarChart, IconFileText, IconHome, IconList, IconSettings } from 'ui'
import SVG from 'react-inlinesvg'
import { products } from 'shared-data'

import { BASE_PATH } from 'lib/constants'

export const PROJECT_PAGES = [
  {
    key: 'home',
    name: 'Overview',
    url: '/project/[ref]',
    icon: <IconHome size={16} strokeWidth={2} />,
  },
  {
    key: 'editor',
    name: 'Table Editor',
    url: '/project/[ref]/editor',
    icon: (
      <SVG
        src={`${BASE_PATH}/img/table-editor.svg`}
        style={{ width: `${16}px`, height: `${16}px` }}
        preProcessor={(code) => code.replace(/svg/, 'svg class="m-auto text-color-inherit"')}
      />
    ),
  },
  {
    key: 'sql',
    name: 'SQL Editor',
    url: '/project/[ref]/sql',
    icon: (
      <SVG
        src={`${BASE_PATH}/img/sql-editor.svg`}
        style={{ width: `${16}px`, height: `${16}px` }}
        preProcessor={(code) => code.replace(/svg/, 'svg class="m-auto text-color-inherit"')}
      />
    ),
  },
  {
    key: 'database',
    name: 'Database',
    url: '/project/[ref]/database/tables',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={products.database.icon[16]}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'auth',
    name: 'Authentication',
    url: '/project/[ref]/auth/users',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={products.authentication.icon[18]}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'storage',
    name: 'Storage',
    url: '/project/[ref]/storage/buckets',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={products.storage.icon[16]}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'functions',
    name: 'Edge Functions',
    url: '/project/[ref]/functions',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={products.functions.icon[16]}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'reports',
    name: 'Reports',
    url: '/project/[ref]/reports',
    icon: <IconBarChart size={16} strokeWidth={2} />,
  },
  {
    key: 'logs',
    name: 'Logs',
    url: '/project/[ref]/logs/explorer',
    icon: <IconList size={16} strokeWidth={2} />,
  },
  {
    key: 'api',
    name: 'API',
    url: '/project/[ref]/api',
    icon: <IconFileText size={16} strokeWidth={2} />,
  },
  {
    key: 'settings',
    name: 'Settings',
    url: '/project/[ref]/settings/general',
    icon: <IconSettings size={16} strokeWidth={2} />,
  },
]

export const ORGANIZATION_PAGES = [
  { key: 'home', name: 'Projects', url: '/org/[slug]' },
  { key: 'team', name: 'Team', url: '/org/[slug]/team' },
  { key: 'integrations', name: 'Integrations', url: '/org/[slug]/integrations' },
  { key: 'apps', name: 'OAuth Apps', url: '/org/[slug]/apps' },
  { key: 'usage', name: 'Usage', url: '/org/[slug]/usage' },
  { key: 'billing', name: 'Billing', url: '/org/[slug]/billing' },
  { key: 'audit', name: 'Audit Logs', url: '/org/[slug]/audit' },
  { key: 'settings', name: 'Settings', url: '/org/[slug]/general' },
]
