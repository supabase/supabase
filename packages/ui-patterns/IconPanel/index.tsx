import { useTheme } from 'next-themes'
import * as React from 'react'
import { ChevronRight } from 'react-feather'
import ReactTooltip from 'react-tooltip'

interface Props {
  title?: string
  tooltip?: string

  icon?: string | React.ReactNode
  iconSize?: 'sm' | 'lg'
  children?: React.ReactNode

  background?: boolean

  hasLightIcon?: boolean

  showLink?: boolean
  hideArrow?: boolean
}

export const IconPanel = ({
  title,
  tooltip,
  icon,
  iconSize = 'sm',
  children,
  background = true,
  hasLightIcon,
  showLink = false,
  hideArrow = false,
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
    <>
      <div className={['relative', 'group'].join(' ')} data-tip={tooltip}>
        <div className={['peer relative', 'flex flex-col', icon ? 'gap-6' : 'gap-2'].join(' ')}>
          <div
            className={[
              'flex',
              children ? 'items-start' : 'items-center',
              (title || !hideArrow || showLink) && 'gap-3',
            ].join(' ')}
          >
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
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                {title && <h5 className="text-base text-foreground m-0">{title}</h5>}
                {!hideArrow && (
                  <div
                    className="
                transition-all ease-out -ml-1 opacity-0
                text-foreground-muted
                group-hover:opacity-100
                group-hover:ml-0"
                  >
                    <ChevronRight strokeWidth={2} size={14} />
                  </div>
                )}
              </div>
              {children && (
                <span className="text-sm text-foreground-light not-prose">{children}</span>
              )}
              {showLink && <span className="text-brand justify-end text-sm">Learn more</span>}
            </div>
          </div>
        </div>
        <div
          className="
        absolute transition-all ease-in
        -z-10 -inset-3 rounded-2xl
        bg-surface-100 opacity-0 peer-hover:opacity-100"
        ></div>
      </div>
      {tooltip && (
        <ReactTooltip
          effect="solid"
          backgroundColor="hsl(var(--background-alternative-default))"
          textColor="hsl(var(--foreground-light))"
          className="!py-2 !px-4"
        />
      )}
    </>
  )
}
