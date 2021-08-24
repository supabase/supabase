import {
  IconColumns,
  IconTerminal,
  IconUsers,
  IconZap,
  IconHome,
  IconFile,
  IconArchive,
  IconDatabase,
  IconBarChart,
  IconFileText,
  IconSettings,
} from '@supabase/ui'
import Link from 'next/link'
import { ReactElement } from 'react'

/**
 * Route: Type definition for Sidebar Items
 */
type Route = {
  key: string
  label: string
  icon: ReactElement
  link: string
}

/**
 * Full list of Sidebar Routes
 */
const ROUTES: Route[] = [
  { key: 'ICON', label: 'Supabase', icon: <IconZap size={20} strokeWidth={2} />, link: '/' },
  { key: 'HOME', label: 'Home', icon: <IconHome size={20} strokeWidth={2} />, link: '/' },
  {
    key: 'Tables',
    label: 'Table Editor',
    icon: <IconColumns size={20} strokeWidth={2} />,
    link: '/editor',
  }, //TODO: Find proper table editor icon
  {
    key: 'AUTH',
    label: 'Authentication',
    icon: <IconUsers size={20} strokeWidth={2} />,
    link: '/auth',
  },
  {
    key: 'Storage',
    label: 'Storage',
    icon: <IconArchive size={20} strokeWidth={2} />,
    link: '/storage',
  },
  { key: 'SQL', label: 'SQL', icon: <IconTerminal size={20} strokeWidth={2} />, link: '/sql' },
  {
    key: 'Database',
    label: 'Database',
    icon: <IconDatabase size={20} strokeWidth={2} />,
    link: '/database',
  },
  {
    key: 'Reports',
    label: 'Reports',
    icon: <IconBarChart size={20} strokeWidth={2} />,
    link: '/reports',
  },
  { key: 'API', label: 'API', icon: <IconFileText size={20} strokeWidth={2} />, link: '/docs' },
  {
    key: 'Settings',
    label: 'Settings',
    icon: <IconSettings size={20} strokeWidth={2} />,
    link: '/settings',
  },
]

/**
 * Icon nav bar
 */
export default function IconBar({}) {
  // Renders all the icons
  const renderNav = (routes: Route[]) => {
    return routes.map((x) => (
      <li key={x.key}>
        <Link href={x.link}>
          <a
            className={[
              'flex items-center justify-center mx-2 mt-2 h-10 w-10 rounded', // Layout
              'text-gray-600 hover:bg-gray-200', // Light mode
              'dark:text-gray-400 dark:hover:bg-bg-alt-dark dark:hover:text-white', // Dark mode
            ].join(' ')}
          >
            {x.icon}
          </a>
        </Link>
      </li>
    ))
  }

  return <ul className="">{renderNav(ROUTES)}</ul>
}
