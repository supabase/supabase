'use client'

import { useTheme } from 'next-themes'
import Image from 'next/image'
import * as React from 'react'
import { cn } from 'ui'

interface Props {
  title: string
  /** Brand/company name for logo alt text when the logo is the only place that name appears. */
  name?: string
  icon?: string | React.ReactNode
  children?: React.ReactNode
  header?: string
  className?: string
  logo?: string
  logoInverse?: string
  hasLightIcon?: boolean
  showLink?: boolean
  showIconBg?: boolean
  badge?: React.ReactNode
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
    aria-hidden="true"
  >
    {children}
  </div>
)

const LogoComponent = ({
  logoImage,
  className,
  wrapperClassName,
  alt,
}: {
  logoImage: string
  className?: string
  wrapperClassName?: string
  alt: string
}) => (
  <div className={cn('relative box-content p-4 pb-0 md:p-6 md:pb-0', wrapperClassName)}>
    <div className="relative h-[33px] w-auto max-w-[145px]">
      <Image
        src={logoImage}
        alt={alt}
        fill
        sizes="100%"
        className={cn('object-contain object-left', className)}
      />
    </div>
  </div>
)

export const GlassPanel = ({
  title,
  name,
  icon,
  children,
  header,
  logo,
  logoInverse,
  hasLightIcon,
  showLink = false,
  showIconBg = false,
  badge,
  className,
}: Props) => {
  const { resolvedTheme } = useTheme()
  const logoAlt = name ?? ''

  return (
    <div
      className={cn(
        'relative',
        'h-full',
        'cursor-pointer',
        'overflow-hidden',
        'border rounded-lg',
        'text-left',
        'bg-surface-75 hover:border-strong',
        'transition',
        className
      )}
    >
      {logoInverse && (
        <LogoComponent
          logoImage={logoInverse}
          alt={logoAlt}
          className="opacity-50"
          wrapperClassName="hidden dark:block"
        />
      )}
      {logo && (
        <LogoComponent
          logoImage={logo}
          alt={logoAlt}
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
      <div
        className={cn(
          'relative px-4.5 py-4 md:px-5.5 md:py-5.5',
          'flex flex-col h-full',
          icon ? 'gap-3' : 'gap-2',
          header && 'pt-0'
        )}
      >
        <div className="flex items-center gap-3">
          {icon && typeof icon === 'string' ? (
            <IconBackground showIconBg={showIconBg}>
              <img
                className="w-5"
                alt=""
                src={`${icon}${
                  hasLightIcon && !resolvedTheme?.includes('dark') ? '-light' : ''
                }.svg`}
              />
            </IconBackground>
          ) : (
            icon && <IconBackground showIconBg={showIconBg}>{icon}</IconBackground>
          )}
          <p className="text-base text-foreground flex items-center gap-2">
            {title}
            {badge}
          </p>
        </div>

        {children && <span className="text-sm text-foreground-light grow">{children}</span>}
        {showLink && <span className="text-brand justify-end text-sm">Learn more</span>}
      </div>
    </div>
  )
}
