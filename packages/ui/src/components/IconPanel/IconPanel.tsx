import { useTheme } from 'common/Providers'
import * as React from 'react'
import { ChevronRight } from 'react-feather'

interface Props {
  title: string

  icon?: string | React.ReactNode
  children?: React.ReactNode

  background?: boolean

  hasLightIcon?: boolean

  showLink?: boolean
}

const IconPanel = ({
  title,
  icon,
  children,
  background = true,
  hasLightIcon,
  showLink = false,
}: Props) => {
  const { isDarkMode } = useTheme()

  const IconContainer: React.FC = (props) => {
    return (
      <div
        className={[
          'relative',
          'flex items-center justify-center shrink-0',
          'h-10 w-10 rounded-lg',
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
    <div className={['relative', 'group'].join(' ')}>
      <div className={['peer relative', 'flex flex-col', icon ? 'gap-6' : 'gap-2'].join(' ')}>
        <div className={['flex gap-3', children ? 'items-start' : 'items-center'].join(' ')}>
          {typeof icon === 'string' ? (
            <IconContainer>
              <img
                className="w-5"
                src={`${icon}${hasLightIcon && !isDarkMode ? '-light' : ''}.svg`}
              />
            </IconContainer>
          ) : (
            <IconContainer>{icon}</IconContainer>
          )}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h5 className="text-base text-scale-1200 m-0">{title}</h5>
              <div
                className="
                transition-all ease-out -ml-1 opacity-0 
                text-scale-800
                group-hover:opacity-100
                group-hover:ml-0"
              >
                <ChevronRight strokeWidth={2} size={14} />
              </div>
            </div>
            {children && <span className="text-sm text-scale-1100 not-prose">{children}</span>}
            {showLink && <span className="text-brand-900 justify-end text-sm">Learn more</span>}
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
  )
}

export default IconPanel
