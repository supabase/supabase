import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { forwardRef, HTMLAttributes, KeyboardEvent, ReactNode } from 'react'
import { CardContent, cn } from 'ui'

export interface ResourceItemProps extends HTMLAttributes<HTMLDivElement> {
  media?: ReactNode
  meta?: ReactNode
  onClick?: () => void
  children?: ReactNode
  href?: string
  target?: string
  rel?: string
}

export const ResourceItem = forwardRef<HTMLDivElement, ResourceItemProps>(
  (
    {
      media,
      meta,
      onClick,
      children,
      className,
      href,
      target,
      rel,
      onKeyDown,
      role,
      tabIndex,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)

      if (event.defaultPrevented || !onClick || event.target !== event.currentTarget) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onClick()
      }
    }

    const content = (
      <>
        {media && (
          <div className="text-foreground-light flex items-center justify-center">{media}</div>
        )}
        <div className="flex-1">{children}</div>
        {meta && <div>{meta}</div>}
        {onClick && <ChevronRight strokeWidth={1.5} size={16} />}
      </>
    )

    const rootClassName = cn(
      'flex items-center justify-between text-sm gap-4',
      'border-b-0!',
      (onClick || href) && 'cursor-pointer transition-colors duration-150 hover:bg-surface-200',
      className
    )

    if (href) {
      return (
        <Link
          href={href}
          target={target}
          rel={rel}
          className={cn('py-4 px-(--card-padding-x) border-b last:border-none', rootClassName)}
        >
          {content}
        </Link>
      )
    }

    return (
      <CardContent
        ref={ref}
        className={rootClassName}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={onClick ? 'button' : role}
        tabIndex={onClick ? (tabIndex ?? 0) : tabIndex}
        {...props}
      >
        {content}
      </CardContent>
    )
  }
)

ResourceItem.displayName = 'ResourceItem'
