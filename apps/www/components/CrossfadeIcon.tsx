import { useId, type ReactNode } from 'react'
import { cn } from 'ui'

export interface CrossfadeIconProps {
  isActive: boolean
  activeIcon: ReactNode
  inactiveIcon: ReactNode
  className?: string
}

const iconClassName = (isShown: boolean) =>
  cn(
    'absolute inset-0 flex items-center justify-center',
    'transition duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
    'motion-reduce:transition-none',
    isShown ? 'scale-100 opacity-100 blur-none' : 'scale-25 opacity-0 blur-xs'
  )

export const CrossfadeIcon = ({
  isActive,
  activeIcon,
  inactiveIcon,
  className,
}: CrossfadeIconProps) => (
  <span aria-hidden className={cn('relative block size-3.5', className)}>
    <span className={iconClassName(isActive)}>{activeIcon}</span>
    <span className={iconClassName(!isActive)}>{inactiveIcon}</span>
  </span>
)

export const CircleCheckFilled = ({ className }: { className?: string }) => {
  const maskId = useId()

  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn('text-foreground', className)}>
      <mask id={maskId}>
        <rect width="24" height="24" className="fill-white" />
        <path
          d="m9 12 2 2 4-4"
          className="stroke-black"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </mask>
      <circle cx="12" cy="12" r="10" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  )
}
