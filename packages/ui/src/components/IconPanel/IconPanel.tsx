import { useTheme } from 'common/Providers'
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

const IconPanel = ({
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
  const { isDarkMode } = useTheme()

  const IconContainer: React.FC = (props) => {
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
            ? 'border-scale-500 hover:border-scale-700 bg-white dark:bg-scale-300'
            : 'border-scale-400 hover:border-scale-500 bg-transparent',
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
                  src={`${icon}${hasLightIcon && !isDarkMode ? '-light' : ''}.svg`}
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
                {title && <h5 className="text-base text-scale-1200 m-0">{title}</h5>}
                {!hideArrow && (
                  <div
                    className="
                transition-all ease-out -ml-1 opacity-0 
                text-scale-800
                group-hover:opacity-100
                group-hover:ml-0"
                  >
                    <ChevronRight strokeWidth={2} size={14} />
                  </div>
                )}
              </div>
              {children && <span className="text-sm text-scale-1100 not-prose">{children}</span>}
              {showLink && <span className="text-brand justify-end text-sm">Learn more</span>}
            </div>
          </div>
        </div>
        <div
          className="
        absolute transition-all ease-in 
        -z-10 -inset-3 rounded-2xl 
        bg-scale-200 dark:bg-whiteA-300 opacity-0 peer-hover:opacity-100"
        ></div>
      </div>
      {tooltip && (
        <ReactTooltip
          effect="solid"
          backgroundColor="var(--colors-scale1)"
          textColor="var(--colors-scale11)"
          className="!py-2 !px-4"
        />
      )}
    </>
  )
}

export default IconPanel
