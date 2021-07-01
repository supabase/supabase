import { IconColumns, IconZap } from '@supabase/ui'
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
  { key: 'ICON', label: 'Supabase', icon: <IconZap size={20} strokeWidth={3} />, link: '/' },
  { key: 'API', label: 'API', icon: <IconColumns size={20} strokeWidth={3} />, link: '/docs' },
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
              'bg-gray-200 text-gray-600 hover:bg-gray-200', // Light mode
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
