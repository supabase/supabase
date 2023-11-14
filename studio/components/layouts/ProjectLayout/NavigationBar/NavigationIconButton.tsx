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
          wrap={(children) => <Link href={route.link!}>{children}</Link>}
        >
          <span
            className={[
              'transition-colors duration-200',
              'flex items-center justify-center h-10 w-10 rounded', // Layout
              'bg-background hover:bg-overlay-hover', // Light mode
              'text-foreground-lighter hover:text-foreground ', // Dark mode
              `${isActive ? 'bg-selection shadow-sm text-foreground' : ''}`,
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
              'bg-alternative shadow-lg shadow-background-surface-100	py-1.5 px-3 rounded leading-none', // background
              'border border-default', //border
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
