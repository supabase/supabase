import * as Tooltip from '@radix-ui/react-tooltip'
import Link from 'next/link'

import ConditionalWrap from 'components/ui/ConditionalWrap'
import { Route } from 'components/ui/ui.types'

interface NavigationIconButtonProps {
  route: Route
  isActive?: boolean
}

const NavigationIconButton = ({ route, isActive = false }: NavigationIconButtonProps) => {
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
              'text-scale-900 hover:text-foreground ', // Dark mode
              `${isActive ? 'bg-scale-500 shadow-sm text-foreground' : ''}`,
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
            <span className="text-foreground text-xs">{route.label}</span>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export default NavigationIconButton
