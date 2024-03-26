import React from 'react'
import Link from 'next/link'
import Panel from '~/components/Panel'
import { cn } from 'ui'
import { detectBrowser, isBrowser } from 'common'

const ProductCard = ({
  className,
  title,
  subtitle,
  highlights,
  icon,
  image,
  url,
  onClick,
  alignLeft = false,
}: {
  title: string
  subtitle: string | React.ReactNode
  highlights?: string | React.ReactNode
  url: string
  icon?: string
  image?: any
  className?: string
  onClick?: any
  alignLeft?: boolean
}) => (
  <Link
    href={url}
    className={cn(
      'group relative w-full h-[400px] flex flex-col gap-5 lg:flex-row focus:outline-none focus:border-none focus:ring-brand-600 focus:ring-2 focus:rounded-xl',
      className
    )}
    onClick={onClick}
  >
    <Panel
      hasShimmer={isBrowser && detectBrowser() !== 'Safari'}
      hasActiveOnHover
      hasMotion={title.includes('Edge Functions')}
      outerClassName="relative w-full h-full shadow-lg"
      innerClassName={cn(
        `relative overflow-hidden flex-1 flex flex-col items-center gap-5 lg:items-start justify-between
          bg-surface-100 w-full rounded-xl h-full`
      )}
    >
      <div
        className={cn(
          'relative z-10 flex flex-col lg:h-full gap-1 text-foreground mx-auto items-center text-center h-full px-6 py-8',
          alignLeft && 'lg:mx-0 lg:pl-8 lg:items-start lg:text-left lg:max-w-[260px]'
        )}
      >
        <div className="flex items-center justify-center h-12 w-12 bg-alternative rounded-lg mb-3">
          {icon && (
            <svg
              width="25"
              height="25"
              viewBox="0 0 25 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d={icon}
                stroke="var(--colors-brand9)"
                strokeMiterlimit="10"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </div>
        <h2 className="text-xl">{title}</h2>
        <div className="flex-1 flex flex-col justify-between gap-2">
          <p className="text-sm text-foreground-lighter">{subtitle}</p>
          {highlights && <span className="hidden lg:block">{highlights}</span>}
        </div>
      </div>
      {image && image}
    </Panel>
  </Link>
)

export default ProductCard
