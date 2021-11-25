import { FC } from 'react'
import Link from 'next/link'
import { Route } from 'components/ui/ui.types'

interface Props {
  route: Route
  isActive?: boolean
}

const NavigationIconButton: FC<Props> = ({ route, isActive = false }) => {
  return (
    <Link href={route.link}>
      <a
        className={[
          'flex items-center justify-center h-10 w-10 rounded', // Layout
          'text-gray-600 hover:bg-gray-100', // Light mode
          'dark:text-gray-400 dark:hover:bg-bg-alt-dark dark:hover:text-white', // Dark mode
          `${isActive ? 'bg-gray-100 dark:bg-bg-alt-dark dark:!text-white' : ''}`,
        ].join(' ')}
      >
        {route.icon}
      </a>
    </Link>
  )
}

export default NavigationIconButton
