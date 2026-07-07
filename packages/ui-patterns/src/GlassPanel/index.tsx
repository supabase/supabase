'use client'

import { useTheme } from 'next-themes'
import Image from 'next/image'
import * as React from 'react'
import { cn } from 'ui'

interface Props {
  title: string
  icon?: string | React.ReactNode
  children?: React.ReactNode
  header?: string
  background?: boolean
  className?: string
  logo?: string
  logoInverse?: string
  hasLightIcon?: boolean
  showLink?: boolean
  showIconBg?: boolean
}

const IconBackground = ({
  children,
  showIconBg,
}: {
  children: React.ReactNode
  showIconBg?: boolean
}) => (
  <div
    className={cn(
      'shrink-0',
      showIconBg ? 'bg-surface-75 border w-8 h-8 flex items-center justify-center rounded-sm' : ''
    )}
  >
    {children}
  </div>
)

const LogoComponent = ({
  logoImage,
  className,
  wrapperClassName,
  title,
}: {
  title: string
  logoImage: string
  className?: string
  wrapperClassName?: string
}) => (
  <div className={cn('relative box-content p-8 pb-0', wrapperClassName)}>
    <div className="relative h-[33px] w-auto max-w-[145px]">
      <Image
        src={logoImage}
        alt={title}
        fill
        sizes="100%"
        className={cn('object-contain object-left', className)}
      />
    </div>
  </div>
)

export const GlassPanel = ({
  title,
  icon,
  children,
  header,
  background = true,
  logo,
  logoInverse,
  hasLightIcon,
  showLink = false,
  showIconBg = false,
  className,
}: Props) => {
  const { resolvedTheme } = useTheme()

  return (
    <div
      className={cn(
        'relative',
        'h-full',
        'group',
        'cursor-pointer',
        'overflow-hidden',
        'border rounded-lg',
        'text-left',
        background
          ? 'hover:border-strong bg-surface-75'
          : 'border-muted hover:border-default bg-transparent',
        'transition',
        className
      )}
    >
      {logoInverse && (
        <LogoComponent
          title={title}
          logoImage={logoInverse}
          className="opacity-50"
          wrapperClassName="hidden dark:block"
        />
      )}
      {logo && (
        <LogoComponent
          title={title}
          logoImage={logo}
          className="opacity-75"
          wrapperClassName={logoInverse ? 'block dark:hidden' : undefined}
        />
      )}

      {header && (
        <img
          src={`${header}`}
          className="transition-all left-0 -top-64 w-full
            duration-700 ease-out
            "
        />
      )}
      {/* <div
        className="absolute left-0 top-0 w-[250px] h-[150px] transform scale-100 opacity-50 group-hover:scale-150 group-hover:opacity-100 transition-all duration-700 ease-out"
        style={{ background: `radial-gradient(100% 100% at 0% 0%, #3EACCF18, transparent)` }}
      /> */}
      <div
        className={cn(
          'px-8 pb-8 relative',
          'flex flex-col h-full',
          icon ? 'gap-6' : 'gap-2',
          !header ? 'pt-8' : ''
        )}
      >
        <div className="flex items-center gap-3">
          {icon && typeof icon === 'string' ? (
            <IconBackground showIconBg={showIconBg}>
              <img
                className="w-5"
                alt={title}
                src={`${icon}${
                  hasLightIcon && !resolvedTheme?.includes('dark') ? '-light' : ''
                }.svg`}
              />
            </IconBackground>
          ) : (
            icon && <IconBackground showIconBg={showIconBg}>{icon}</IconBackground>
          )}
          <p className="text-base text-foreground">{title}</p>
        </div>

        {children && <span className="text-sm text-foreground-light grow">{children}</span>}
        {showLink && <span className="text-brand-link justify-end text-sm">Learn more</span>}
      </div>
    </div>
  )
}
