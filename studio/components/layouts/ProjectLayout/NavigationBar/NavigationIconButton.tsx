import { FC } from 'react'
import Link from 'next/link'
import { Typography } from '@supabase/ui'
import * as Tooltip from '@radix-ui/react-tooltip'

import { Route } from 'components/ui/ui.types'

interface Props {
  route: Route
  isActive?: boolean
}

const NavigationIconButton: FC<Props> = ({ route, isActive = false }) => {
  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger>
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
      </Tooltip.Trigger>
      <Tooltip.Content side="right">
        <Tooltip.Arrow className="radix-tooltip-arrow" />
        <div
          className={[
            'shadow px-2 py-1 rounded border',
            'bg-white',
            'dark:bg-gray-800 dark:border-gray-700',
          ].join(' ')}
        >
          <Typography.Text small>{route.label}</Typography.Text>
        </div>
      </Tooltip.Content>
    </Tooltip.Root>
  )
}

export default NavigationIconButton
