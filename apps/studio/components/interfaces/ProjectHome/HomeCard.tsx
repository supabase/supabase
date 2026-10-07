import Link from 'next/link'
import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle, cn } from 'ui'

// Stretches the title's link/button over the whole card so the card is clickable without
// nesting the header actions inside an interactive element
const STRETCHED_TARGET_CLASS =
  'block w-full truncate text-left outline-hidden after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-1 focus-visible:after:ring-foreground-muted'

type HomeCardTarget = { href: string; onClick?: never } | { onClick: () => void; href?: never }

type HomeCardProps = HomeCardTarget & {
  icon: ReactNode
  label: string
  title: string
  /** Rendered on the right of the header, above the card's click target */
  actions?: ReactNode
  description?: ReactNode
  meta?: ReactNode
  className?: string
}

/** Fixed-height card used by the project homepage rows, with its content anchored to the bottom */
export const HomeCard = ({
  href,
  onClick,
  icon,
  label,
  title,
  actions,
  description,
  meta,
  className,
}: HomeCardProps) => (
  <Card className={cn('relative h-64 flex flex-col', className)}>
    <CardHeader className="border-b-0 shrink-0 flex flex-row gap-2 space-y-0 justify-between items-center">
      <div className="flex flex-row items-center gap-3">
        {icon}
        <CardTitle className="text-foreground-light">{label}</CardTitle>
      </div>
      {actions && <div className="relative z-10 flex items-center gap-1">{actions}</div>}
    </CardHeader>
    <CardContent className="pt-0 flex flex-col justify-end flex-1 min-h-0">
      <h3 className="mb-1">
        {href !== undefined ? (
          <Link href={href} className={STRETCHED_TARGET_CLASS}>
            {title}
          </Link>
        ) : (
          <button type="button" tabIndex={0} onClick={onClick} className={STRETCHED_TARGET_CLASS}>
            {title}
          </button>
        )}
      </h3>
      {description && (
        <div className="text-sm text-muted-foreground line-clamp-3 [&_a]:relative [&_a]:z-10">
          {description}
        </div>
      )}
      {meta && <p className="mt-3 text-sm text-foreground-lighter">{meta}</p>}
    </CardContent>
  </Card>
)
