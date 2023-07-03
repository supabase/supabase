import { FC } from 'react'
import Link from 'next/link'
import * as Tooltip from '@radix-ui/react-tooltip'

import { Route } from 'components/ui/ui.types'
import ConditionalWrap from 'components/ui/ConditionalWrap'

interface Props {
  route: Route
  isActive?: boolean
}

const NavigationIconButton: FC<Props> = ({ route, isActive = false }) => {
  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger>
        <ConditionalWrap
          condition={route.link !== undefined}
          wrap={(children) => (
            <Link href={route.link!}>
              <a>{children}</a>
            </Link>
          )}
        >
          <span
            className={[
              'transition-colors duration-200',
              'flex items-center justify-center h-10 w-10 rounded', // Layout
              'bg-scale-200 hover:bg-scale-500', // Light mode
              'text-scale-900 hover:text-scale-1200 ', // Dark mode
              `${isActive ? 'bg-scale-500 shadow-sm text-scale-1200' : ''}`,
            ].join(' ')}
          >
            {route.icon}
          </span>
        </ConditionalWrap>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="right" sideOffset={5}>
          <Tooltip.Arrow className="radix-tooltip-arrow" />

          <div
            className={[
              'bg-scale-100 shadow-lg shadow-scale-700 dark:shadow-scale-300	py-1.5 px-3 rounded leading-none', // background
              'border border-scale-500 ', //border
            ].join(' ')}
          >
            <span className="text-scale-1200 text-xs">{route.label}</span>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export default NavigationIconButton
