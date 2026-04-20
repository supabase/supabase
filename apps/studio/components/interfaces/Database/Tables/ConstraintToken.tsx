import { ReactNode } from 'react'
import { cn } from 'ui'

interface ConstraintTokenProps {
  icon?: ReactNode
  label: string
  variant?: 'default' | 'secondary' | 'primary'
}

const constraintTokenClassName = cn(
  'inline-flex items-center justify-center rounded-md text-center font-mono uppercase whitespace-nowrap font-medium',
  'tracking-[0.06em] text-[11px] leading-[1.1] px-[5.5px] h-[21px]',
  'transition-all border'
)

export const ConstraintToken = ({ icon, label, variant = 'default' }: ConstraintTokenProps) => {
  const tokenToneClassName =
    variant === 'primary'
      ? 'bg-brand bg-opacity-10 text-brand-600 border-brand-500'
      : variant === 'default'
        ? 'bg-surface-75 text-foreground-light border-strong'
        : 'bg-surface-75 bg-opacity-50 text-foreground-light border-strong'

  return (
    <div className="inline-flex items-center whitespace-nowrap">
      {icon && (
        <span
          className={cn(constraintTokenClassName, tokenToneClassName, 'rounded-r-none border-r-0')}
        >
          {icon}
        </span>
      )}
      <span
        className={cn(
          constraintTokenClassName,
          tokenToneClassName,
          icon ? 'rounded-l-none' : 'rounded-md'
        )}
      >
        {label}
      </span>
    </div>
  )
}
