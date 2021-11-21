import {
  IconColumns,
  IconTerminal,
  IconUsers,
  IconHome,
  IconFile,
  IconArchive,
  IconDatabase,
  IconBarChart,
  IconFileText,
  IconSettings,
} from '@supabase/ui'
import Image from 'next/image'
import Link from 'next/link'
import { ReactElement } from 'react'
import SupabaseLogo from '../../public/supabase-logo.svg'

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
  { key: 'ICON', label: 'Supabase', icon: <Image src={SupabaseLogo} height={80} />, link: '/' },
  {
    key: 'HOME',
    label: 'Home',
    icon: <IconHome size={20} strokeWidth={2} />,
    link: '/project/default/',
  },
  {
    key: 'Tables',
    label: 'Table Editor',
    icon: <IconColumns size={20} strokeWidth={2} />,
    link: '/project/default/editor',
  }, //TODO: Find proper table editor icon
  // {
  //   key: 'AUTH',
  //   label: 'Authentication',
  //   icon: <IconUsers size={20} strokeWidth={2} />,
  //   link: '/project/default/auth',
  // },
  // {
  //   key: 'Storage',
  //   label: 'Storage',
  //   icon: <IconArchive size={20} strokeWidth={2} />,
  //   link: '/project/default/storage',
  // },
  {
    key: 'SQL',
    label: 'SQL',
    icon: <IconTerminal size={20} strokeWidth={2} />,
    link: '/project/default/sql',
  },
  // {
  //   key: 'Database',
  //   label: 'Database',
  //   icon: <IconDatabase size={20} strokeWidth={2} />,
  //   link: '/project/default/database',
  // },
  // {
  //   key: 'Reports',
  //   label: 'Reports',
  //   icon: <IconBarChart size={20} strokeWidth={2} />,
  //   link: '/project/default/reports',
  // },
  // { key: 'API', label: 'API', icon: <IconFileText size={20} strokeWidth={2} />, link: '/project/default/docs' },
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
