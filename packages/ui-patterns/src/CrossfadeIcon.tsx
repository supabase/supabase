import { type LucideIcon } from 'lucide-react'
import { cn } from 'ui'

export function CrossfadeIcon({
  active,
  activeIcon: ActiveIcon,
  inactiveIcon: InactiveIcon,
}: {
  active: boolean
  activeIcon: LucideIcon
  inactiveIcon: LucideIcon
}) {
  const iconClass = (shown: boolean) =>
    cn(
      'absolute inset-0 m-auto text-lighter group-hover/btn:text-foreground',
      'transition duration-300 ease-out',
      'motion-reduce:transition-none',
      shown ? 'opacity-100 scale-100 blur-none' : 'opacity-0 scale-[0.25] blur-xs'
    )

  return (
    <span className="relative block size-3.5">
      <ActiveIcon size={14} aria-hidden="true" className={iconClass(active)} />
      <InactiveIcon size={14} aria-hidden="true" className={iconClass(!active)} />
    </span>
  )
}
