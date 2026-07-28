'use client'

import { useTheme } from 'next-themes'
import * as React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface Props {
  title?: string
  tooltip?: string

  icon?: string | React.ReactNode
  iconSize?: 'sm' | 'lg'

  background?: boolean

  hasLightIcon?: boolean
}

export const IconPanel = ({
  title,
  tooltip,
  icon,
  iconSize = 'sm',
  background = true,
  hasLightIcon,
}: Props) => {
  const { theme } = useTheme()

  const IconContainer: React.FC<React.PropsWithChildren> = (props) => {
    return (
      <div
        className={[
          'relative',
          'flex items-center justify-center shrink-0',
          iconSize === 'lg' ? 'h-16 w-16 rounded-lg' : 'h-10 w-10 rounded-lg',
          'group',
          'cursor-pointer',
          'overflow-hidden',
          'border rounded-full',
          background
            ? 'hover:border-strong bg-surface-100'
            : 'border-muted hover:border-default bg-transparent',
          'transition',
        ].join(' ')}
      >
        {props.children}
      </div>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={['relative', 'group'].join(' ')} data-tip={tooltip}>
          <div className={['peer relative', 'flex flex-col', icon ? 'gap-6' : 'gap-2'].join(' ')}>
            <div className={['flex items-center', title && 'gap-3'].join(' ')}>
              {typeof icon === 'string' ? (
                <IconContainer>
                  <img
                    className={iconSize === 'lg' ? 'w-8' : 'w-5'}
                    src={`${icon}${hasLightIcon && theme !== 'dark' ? '-light' : ''}.svg`}
                    alt={
                      title !== undefined
                        ? `${title} Icon`
                        : tooltip !== undefined
                          ? `${tooltip} Icon`
                          : 'Icon'
                    }
                  />
                </IconContainer>
              ) : (
                <IconContainer>{icon}</IconContainer>
              )}
              {title && <h5 className="text-base text-foreground m-0">{title}</h5>}
            </div>
          </div>
          <div
            className="
        absolute transition-all ease-in
        -z-10 -inset-3 rounded-2xl
        bg-surface-100 opacity-0 peer-hover:opacity-100"
          ></div>
        </div>
      </TooltipTrigger>

      {tooltip && (
        <TooltipContent side="top" className="">
          {tooltip}
        </TooltipContent>
      )}
    </Tooltip>
  )
}
