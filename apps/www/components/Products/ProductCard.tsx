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
  isDatabase,
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
  isDatabase?: boolean
}) => (
  <Link
    href={url}
    className={cn(
      'group relative w-full sm:h-[400px] flex flex-col gap-5 lg:flex-row focus:outline-none focus:border-none focus:ring-brand-600 focus:ring-2 focus:rounded-xl',
      className
    )}
    onClick={onClick}
  >
    <Panel
      hasShimmer={isBrowser && detectBrowser() !== 'Safari'}
      hasActiveOnHover
      hasMotion={title.includes('Edge Functions')}
      outerClassName="relative w-full h-full"
      innerClassName={cn(
        'relative overflow-hidden flex-1 flex flex-row sm:flex-col gap-4 items-start sm:items-center lg:items-start justify-between',
        'bg-surface-75 w-full h-full text-foreground-lighter [&_strong]:!font-normal [&_strong]:!text-foreground',
        'p-4 sm:py-6'
      )}
    >
      <div
        className={cn(
          'relative z-10',
          'h-full w-full',
          'mx-auto gap-2 sm:gap-4',
          'flex flex-col items-start sm:items-center',
          'text-left sm:text-center',
          alignLeft && !isDatabase && 'lg:mx-0 lg:pl-2 lg:items-start lg:text-left',
          alignLeft &&
            isDatabase &&
            'md:ml-2 md:mt-2 lg:pl-0 md:justify-start md:max-w-[250px] md:text-left md:items-start'
        )}
      >
        <div className="flex items-center gap-2 text-foreground">
          {icon && (
            <svg
              width="18"
              height="18"
              viewBox="0 0 25 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d={icon}
                stroke="currentColor"
                strokeMiterlimit="10"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          )}
          <h2 className="">{title}</h2>
        </div>
        <div className="flex-1 flex flex-col justify-between gap-2">
          <p className="text-sm [&_strong]:!text-foreground">{subtitle}</p>
          {highlights && (
            <span className={cn('hidden lg:block text-foreground', isDatabase && 'md:block')}>
              {highlights}
            </span>
          )}
        </div>
      </div>
      {image && image}
    </Panel>
  </Link>
)

export default ProductCard
