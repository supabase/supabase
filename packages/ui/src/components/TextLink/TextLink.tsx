import Link from 'next/link'
import { IconChevronRight, cn } from 'ui'

interface Props {
  label: string
  url?: string
  className?: string
  hasChevron?: boolean
  chevronAnimation?: 'translate' | 'fadeIn'
  target?: '_blank' | '_self'
}

function TextLink({
  url = '',
  label,
  className,
  hasChevron = true,
  chevronAnimation = 'translate',
  target = '_self',
  ...props
}: Props) {
  return (
    <Link
      href={url}
      className={cn(
        'text-foreground-light hover:text-foreground mt-3 block cursor-pointer text-sm focus-visible:ring-2 focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-foreground-lighter focus-visible:text-foreground',
        className
      )}
      target={target}
      {...props}
    >
      <div className="group flex items-center gap-1">
        <span className="sr-only">{`${label} about ${url}`}</span>
        <span>{label}</span>
        {hasChevron && (
          <div
            className={cn(
              'transition-all group-hover:ml-0.5',
              chevronAnimation === 'fadeIn' && 'opacity-0 group-hover:opacity-100'
            )}
          >
            <IconChevronRight size={14} strokeWidth={2} />
          </div>
        )}
      </div>
    </Link>
  )
}

export default TextLink
