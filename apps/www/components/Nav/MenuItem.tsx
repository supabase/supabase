import Link from 'next/link'
import React from 'react'
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
          'group flex flex-col text-light hover:text-strong select-none gap-2 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-overlay-hover focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground-strong',
          description && 'items-start',
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <div className="flex items-center gap-2">
              {icon && (
                <div>
                  <svg
                    className="h-5 w-5 group-hover:text-brand"
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
              <div className={cn('leading-none', description && 'mt-0.5')}>{title}</div>
            </div>
            {description && (
              <p className="line-clamp-1 text-sm leading-snug text-lighter">{description}</p>
            )}
          </>
        )}
      </a>
    </Link>
  )
})

export default MenuItem
