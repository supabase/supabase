import { useTheme } from 'common/Providers'
import * as React from 'react'
import Image from 'next/image'

interface Props {
  title: string
  span?: string
  icon?: string | React.ReactNode
  children?: React.ReactNode
  header?: string
  background?: boolean
  logo?: string
  logoInverse?: string
  hasLightIcon?: boolean
  showLink?: boolean
  showIconBg?: boolean
}

const GlassPanel = ({
  title,
  span,
  icon,
  children,
  header,
  background = true,
  logo,
  logoInverse,
  hasLightIcon,
  showLink = false,
  showIconBg = false,
}: Props) => {
  const { isDarkMode } = useTheme()
  const showLogoInverse = logoInverse && isDarkMode
  const showLogo = !showLogoInverse && logo

  const IconBackground: React.FC = (props) => (
    <div
      className={[
        'shrink-0',
        showIconBg ? 'bg-green-600 w-8 h-8 flex items-center justify-center rounded' : '',
      ].join(' ')}
    >
      {props.children}
    </div>
  )

  const LogoComponent = ({ logoImage, className }: { logoImage: string; className?: string }) => (
    <div className="relative box-content p-8 pb-0">
      <div className="relative h-[33px] w-auto max-w-[145px]">
        <Image
          src={logoImage}
          layout="fill"
          objectFit="contain"
          objectPosition="left"
          className={className}
        />
      </div>
    </div>
  )

  return (
    <div
      className={[
        'relative',
        'h-full',
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
      {showLogoInverse && <LogoComponent logoImage={logoInverse} className="opacity-50" />}
      {showLogo && <LogoComponent logoImage={logo} className="opacity-75" />}

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
        className={[
          'px-8 pb-8 relative',
          'flex flex-col h-full',
          icon ? 'gap-6' : 'gap-2',
          !header ? 'pt-8' : '',
        ].join(' ')}
      >
        <div className="flex items-center gap-3">
          {icon && typeof icon === 'string' ? (
            <IconBackground>
              <img
                className="w-5"
                src={`${icon}${hasLightIcon && !isDarkMode ? '-light' : ''}.svg`}
              />
            </IconBackground>
          ) : (
            icon && <IconBackground>{icon}</IconBackground>
          )}
          <h5 className="text-base text-scale-1200">{title}</h5>
        </div>

        {children && <span className="text-sm text-scale-1100 flex-grow">{children}</span>}
        {showLink && <span className="text-brand-900 justify-end text-sm">Learn more</span>}
      </div>
    </div>
  )
}

export default GlassPanel
