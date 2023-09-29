import React from 'react'
import Link from 'next/link'
import { cn } from 'ui'

const MenuItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & { description?: string; icon?: string }
>(({ className, title, href = '', description, icon, children, ...props }, ref) => {
  return (
    <Link href={href} passHref>
      <a
        ref={ref}
        className={cn(
          'group flex items-center text-light hover:text-strong select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-surface-200 focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground-strong',
          description && 'items-center',
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            {icon && (
              <div className="shrink-0 bg-surface-300 min-w-12 w-12 h-12 flex items-center justify-center rounded-lg">
                <svg
                  className="h-5 w-5 group-hover:text-brand group-focus-visible:text-brand"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d={icon}
                    stroke="currentColor"
                  />
                </svg>
              </div>
            )}
            <div className="flex flex-col justify-center gap-1">
              <div className={cn('leading-none')}>{title}</div>
              {description && (
                <p className="line-clamp-1 text-sm leading-snug text-lighter group-hover:text-light group-focus-visible:text-light">
                  {description}
                </p>
              )}
            </div>
          </>
        )}
      </a>
    </Link>
  )
})

export default MenuItem
