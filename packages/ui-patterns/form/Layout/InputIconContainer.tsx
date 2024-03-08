import { cn } from 'ui'

export default function InputIconContainer({ icon, className }: any) {
  return (
    <div
      className={cn(
        'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-light',
        className
      )}
    >
      {icon}
    </div>
  )
}
