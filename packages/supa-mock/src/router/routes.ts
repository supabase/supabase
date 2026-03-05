import {
  Auth,
  Database,
  EdgeFunctions,
  Home,
  Realtime,
  SqlEditor,
  Storage,
  TableEditor,
} from 'icons'
import { Blocks, FileText, Lightbulb, List, Settings, Telescope } from 'lucide-react'
import type { ComponentType } from 'react'
import { createElement } from 'react'

import { AuthScreen } from '../screens/AuthScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { PlaceholderScreen } from '../screens/PlaceholderScreen'
import { StorageScreen } from '../screens/StorageScreen'
import { TableEditorScreen } from '../screens/TableEditorScreen'
import type { MockRoute } from '../types'

const ICON_SIZE = 32
const ICON_STROKE_WIDTH = 1.5

export const MOCK_ROUTES: MockRoute[] = [
  {
    key: 'HOME',
    path: '/dashboard/project',
    label: 'Project Overview',
    icon: createElement(Home, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: HomeScreen,
  },
  {
    key: 'editor',
    path: '/dashboard/project/editor',
    label: 'Table Editor',
    icon: createElement(TableEditor, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: TableEditorScreen,
  },
  {
    key: 'sql',
    path: '/dashboard/project/sql',
    label: 'SQL Editor',
    icon: createElement(SqlEditor, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: PlaceholderScreen,
    disabled: true,
  },
  {
    key: 'database',
    path: '/dashboard/project/database',
    label: 'Database',
    icon: createElement(Database, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: PlaceholderScreen,
    disabled: true,
  },
  {
    key: 'auth',
    path: '/dashboard/project/auth',
    label: 'Authentication',
    icon: createElement(Auth, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: AuthScreen,
  },
  {
    key: 'storage',
    path: '/dashboard/project/storage',
    label: 'Storage',
    icon: createElement(Storage, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: StorageScreen,
  },
  {
    key: 'functions',
    path: '/dashboard/project/functions',
    label: 'Edge Functions',
    icon: createElement(EdgeFunctions, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: PlaceholderScreen,
    disabled: true,
  },
  {
    key: 'realtime',
    path: '/dashboard/project/realtime',
    label: 'Realtime',
    icon: createElement(Realtime, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: PlaceholderScreen,
    disabled: true,
  },
  {
    key: 'advisors',
    path: '/dashboard/project/advisors',
    label: 'Advisors',
    icon: createElement(Lightbulb, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: PlaceholderScreen,
    disabled: true,
  },
  {
    key: 'observability',
    path: '/dashboard/project/observability',
    label: 'Observability',
    icon: createElement(Telescope, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: PlaceholderScreen,
    disabled: true,
  },
  {
    key: 'logs',
    path: '/dashboard/project/logs',
    label: 'Logs',
    icon: createElement(List, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: PlaceholderScreen,
    disabled: true,
  },
  {
    key: 'api',
    path: '/dashboard/project/api',
    label: 'API Docs',
    icon: createElement(FileText, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: PlaceholderScreen,
    disabled: true,
  },
  {
    key: 'integrations',
    path: '/dashboard/project/integrations',
    label: 'Integrations',
    icon: createElement(Blocks, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: PlaceholderScreen,
    disabled: true,
  },
  {
    key: 'settings',
    path: '/dashboard/project/settings',
    label: 'Project Settings',
    icon: createElement(Settings, { size: ICON_SIZE, strokeWidth: ICON_STROKE_WIDTH }),
    component: PlaceholderScreen,
    disabled: true,
  },
]

export const TOOL_KEYS = ['editor', 'sql']
export const PRODUCT_KEYS = ['database', 'auth', 'storage', 'functions', 'realtime']
export const OTHER_KEYS = ['advisors', 'observability', 'logs', 'api', 'integrations']
export const SETTINGS_KEYS = ['settings']

export function resolveScreen(path: string): ComponentType {
  const route = MOCK_ROUTES.find((r) => r.path === path)
  return route?.component ?? PlaceholderScreen
}
