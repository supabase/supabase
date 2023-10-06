import React from 'react'
import Link from 'next/link'
import { cn } from 'ui'
import { ArrowRight } from 'lucide-react'

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & { description?: string; icon?: string }
>(({ className, title, href = '', description, icon, children, ...props }, ref) => {
  return (
    <Link href={href} passHref>
      <a
        ref={ref}
        className={cn(
          'group flex text-light hover:text-strong select-none gap-3 rounded-md p-0 leading-none no-underline outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground-strong',
          description,
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            {icon && (
              <div className="shrink-0 bg-transparent min-w-4 w-4 h-4 flex items-center justify-center rounded-lg">
                <svg
                  className="transition w-4 h-4 text-light mt-1 group-hover:text-foreground group-focus-visible:text-foreground"
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
              <div className="flex items-center gap-1">
                <div className={cn('leading-none text-sm text-foreground')}>{title}</div>
                <ArrowRight
                  size={12}
                  className="top-1 transition-all duration-150 text-transparent -ml-1 group-hover:ml-0 group-hover:text-foreground"
                />
              </div>
              {description && (
                <p className="line-clamp-1 text-xs leading-snug text-light group-hover:text group-focus-visible:text-light">
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

export default DropdownMenuItem
