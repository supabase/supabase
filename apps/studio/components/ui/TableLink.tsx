import Link from 'next/link'
import { ComponentProps, CSSProperties } from 'react'
import { cn } from 'ui'

interface TableLinkProps extends ComponentProps<typeof Link> {
  /**
   * Maximum width before truncating. Defaults to 240px.
   */
  maxWidth?: string | number
  weight?: 'normal' | 'medium'
}

/**
 * A reusable link component for table cells with hover underline effect.
 * Provides consistent styling across table links with cursor pointer and fade-in underline.
 */
export const TableLink = ({
  className,
  maxWidth = 240,
  weight = 'medium',
  style,
  children,
  ...props
}: TableLinkProps) => {
  const maxWidthValue = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth
  const inlineStyle: CSSProperties = {
    maxWidth: maxWidthValue,
    ...style,
  }

  return (
    <Link
      className={cn(
        `font-${weight} text-foreground truncate cursor-pointer underline underline-offset-4 decoration-foreground-muted/50 hover:decoration-foreground-lighter/80 transition-colors duration-100`,
        className
      )}
      style={inlineStyle}
      {...props}
    >
      {children}
    </Link>
  )
}
