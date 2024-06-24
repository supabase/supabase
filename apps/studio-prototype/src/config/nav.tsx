import {
  Auth,
  EdgeFunctions,
  Logs,
  Database,
  Realtime,
  Reports,
  SqlEditor,
  Storage,
  TableEditor,
  Settings,
} from 'icons'
import { cn } from 'ui'

const STROKE_WIDTH = 1
const ICON_SIZE = 21
const iconsClasses = cn(
  'text-foreground-lighter',
  'group-aria-[current=page]/nav-item-anchor:text-foreground',
  'group-aria-[current=page]/nav-item-anchor:stroke-[1.5]',
  'group-hover/nav-item-anchor:text-foreground-light',
  'group-hover/nav-item-anchor:stroke-[1.3]',
  'transition-all'
)

const SideNav = [
  {
    name: 'table-editor',
    label: 'Table Editor',
    icon: <TableEditor strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
    href: '/table-editor',
  },
  {
    name: 'sql-editor',
    label: 'SQL Editor',
    icon: <SqlEditor strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
    href: '/sql-editor',
  },
  {
    name: 'authentication',
    label: 'Authentication',
    icon: <Auth strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
    href: '/authentication',
  },
  {
    name: 'database',
    label: 'Database',
    icon: <Database strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
    href: '/database',
  },
  {
    name: 'storage',
    label: 'Storage',
    icon: <Storage strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
    href: '/storage',
  },
  {
    name: 'functions',
    label: 'Edge Functions',
    icon: <EdgeFunctions strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
    href: '/edge-functions',
  },
  {
    name: 'realtime',
    label: 'Realtime',
    icon: <Realtime strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
    href: '/realtime',
  },
  {
    name: 'usage',
    label: 'Usage',
    icon: <Settings strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
    href: '/usage',
  },
  {
    name: 'reports',
    label: 'Reports',
    icon: <Reports strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
    href: '/reports',
  },
  {
    name: 'logs',
    label: 'Logs',
    icon: <Logs strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
    href: '/logs',
  },
  {
    name: 'settings',
    label: 'Settings',
    icon: <Settings strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
    href: '/settings',
  },
]

export { SideNav }
