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
  Postgres,
} from 'icons'
import { cn } from 'ui'
import { IconHandler } from '../app/[org]/icon-handler'
import {
  BarChart2,
  BarChartBig,
  Boxes,
  ClipboardMinus,
  Compass,
  Lightbulb,
  ListTree,
  Users2,
} from 'lucide-react'

const STROKE_WIDTH = 1
const ICON_SIZE = 21
const iconsClasses = cn(
  'text-foreground-lighter',
  'group-aria-[current=page]/nav-item-anchor:text-foreground',
  'group-aria-[current=page]/nav-item-anchor:stroke-[1.6]',
  'group-hover/nav-item-anchor:text-foreground-light',
  'group-hover/nav-item-anchor:stroke-[1.3]',
  'transition-all'
)

const SideNav = [
  [
    // {
    //   name: 'projects',
    //   label: 'Projects',
    //   icon: <Boxes strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
    //   href: '/projects',
    // },
    {
      name: 'table-editor',
      label: 'Explorer',
      icon: <Compass strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/table-editor',
    },
    // {
    //   name: 'sql-editor',
    //   label: 'SQL Editor',
    //   icon: <SqlEditor strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
    //   href: '/sql-editor',
    // },
  ],
  [
    {
      name: 'database',
      label: 'Database',
      icon: <Database strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/database',
    },
    {
      name: 'authentication',
      label: 'Authentication',
      icon: <Users2 strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/authentication',
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
  ],
  [
    {
      name: 'advisor',
      label: 'Advisor',
      icon: <Lightbulb strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/advisor',
    },
    {
      name: 'logs',
      label: 'Logs',
      icon: <ListTree strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/logs',
    },
    {
      name: 'reports',
      label: 'Reports',
      icon: <ClipboardMinus strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/reports',
    },
    {
      name: 'usage',
      label: 'Usage',
      icon: <BarChartBig strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/usage',
    },
  ],
  [
    {
      name: 'settings',
      label: 'Settings',
      icon: <Settings strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/settings',
    },
  ],
]

export { SideNav }
