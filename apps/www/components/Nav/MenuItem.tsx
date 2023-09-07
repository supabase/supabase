import Link from 'next/link'
import React from 'react'
import { cn } from 'ui'
import ProductIcon from '../ProductIcon'

const MenuItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & { description?: string; icon?: string }
>(({ className, title, href = '', description, icon, children, ...props }, ref) => {
  return (
    <Link href={href} passHref>
      <a
        ref={ref}
        className={cn(
          'group flex flex-row select-none space-x-2 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-overlay-hover focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground-strong',
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            {icon && <ProductIcon icon={icon} color="alt" />}
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium leading-none">{title}</div>
              {description && (
                <p className="line-clamp-2 text-sm leading-snug text-light">{description}</p>
              )}
            </div>
          </>
        )}
      </a>
    </Link>
  )
})

export default MenuItem
