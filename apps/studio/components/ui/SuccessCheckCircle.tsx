import { Check } from 'lucide-react'
import { cn } from 'ui'

export const SuccessCheckCircle = ({ className }: { className?: string }) => (
  <span
    className={cn(
      'inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-brand bg-brand text-white dark:text-black',
      className
    )}
  >
    <Check size={12} strokeWidth={3} />
  </span>
)
