import React from 'react'
import { Item } from '../Accordion/Accordion'
import { useTheme } from 'common/Providers'

interface Props {
  title: string
  span?: string
  icon?: string | React.ReactNode
  children?: React.ReactNode
  header?: string
  background?: boolean
  img?: string
  hasLightIcon?: boolean
}

const GlassPanel = ({
  title,
  span,
  icon,
  children,
  header,
  background = true,
  img,
  hasLightIcon,
}: Props) => {
  const { isDarkMode } = useTheme()

  return (
    <div
      className={[
        'relative',
        'group',
        'cursor-pointer',
        'overflow-hidden',
        'border rounded-lg',
        'text-left',
        background
          ? 'border-scale-500 hover:border-scale-700 bg-white dark:bg-scale-300'
          : 'border-scale-400 hover:border-scale-500 bg-transparent',
        'transition',
      ].join(' ')}
    >
      {header && (
        <img
          src={`${header}`}
          className="transition-all left-0 -top-64 w-full
            duration-700 ease-out
            "
        />
      )}
      <img
        src={`/docs/img/gradient-bg.png`}
        className="transition-all absolute left-0 -top-64 w-[258px]
            duration-700 ease-out
            group-hover:w-[320px]
            "
      />
      <div
        className={['px-8 pb-8', 'flex flex-col', icon ? 'gap-6' : 'gap-2', !header && 'pt-8'].join(
          ' '
        )}
      >
        <div className="flex items-center gap-3">
          {typeof icon === 'string' ? (
            <div className="bg-green-600 w-8 h-8 flex items-center justify-center rounded">
              <img
                className="bg-green-600 w-5"
                src={`/docs/img/icons/menu/${icon}${
                  hasLightIcon && !isDarkMode ? '-light' : ''
                }.svg`}
              />
            </div>
          ) : (
            icon
          )}
          <h5 className="text-base text-scale-1200">{title}</h5>
        </div>

        {children && <span className="text-sm text-scale-1100">{children}</span>}
        <span className="text-brand-900 justify-end text-sm">Learn more</span>
      </div>
    </div>
  )
}

export default GlassPanel
