import { IconColumns, IconGrid } from '@supabase/ui'
import Link from 'next/link'
import { ReactElement } from 'react'

type Route = {
    key: string
    label: string
    icon: ReactElement
    link: string
}

const ROUTES: Route[] = [
  { key: 'ICON', label: 'Supabase', icon: <IconGrid />, link: '/' },
  { key: 'API', label: 'API', icon: <IconColumns />, link: '/api' },
  //   { key: 'DATABASE', label: 'Database', icon: <IconMail />, link: '/storage' },
]

/**
 * Icon nav bar
 */
export default function IconBar({}) {

    /**
     * Renders all the icons
     */
  const renderNav = (routes: Route[]) => {
    return routes.map((x) => (
      <li key={x.key}>
        <Link href={x.link}>
          <a className="block h-10 w-10 bg-black mx-2 mt-2 rounded text-gray-300 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-bg-alt-dark dark:hover:text-white">{x.icon}</a>
        </Link>
      </li>
    ))
  }

  return (
    <ul className="">
      {renderNav(ROUTES)}
    </ul>
  )
}
