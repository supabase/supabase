import { cva, type VariantProps } from 'class-variance-authority'
import { KeyboardEvent, ReactNode, useRef } from 'react'
import { useKey } from 'react-use'
import { cn } from 'ui'
import { useCommandMenuOpen } from 'ui-patterns'

const actionButtonVariants = cva(
  'pl-1.5 pr-3 py-1.5 rounded shadow flex justify-center items-center gap-2 outline outline-1 outline-offset-[-1px] cursor-pointer flex-nowrap',
  {
    variants: {
      variant: {
        primary:
          'dark:bg-gradient-to-b from-emerald-400/0 via-emerald-400/30 to-emerald-400/0 dark:shadow-[0px_0px_6px_0px_rgba(44,244,148,0.40)] outline-emerald-400/60',
        secondary:
          'dark:bg-gradient-to-b from-neutral-600/0 via-neutral-600/30 to-neutral-600/0 dark:shadow-[0px_0px_6px_0px_rgba(255,255,255,0.10)] outline-white/10',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
)

const iconVariants = cva(
  'w-5 h-5 px-2 rounded-sm outline outline-1 outline-offset-[-1px] inline-flex flex-col justify-center items-center gap-2',
  {
    variants: {
      variant: {
        primary: 'bg-emerald-950 outline-emerald-400/50',
        secondary: 'bg-neutral-800 outline-stone-500/50',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
)

const textVariants = cva(
  'justify-center text-foreground text-xs leading-[20px] font-normal min-w-[108.25px] [@media(pointer:coarse)]:pl-2 text-nowrap',
  {
    variants: {
      variant: {
        primary: 'dark:[text-shadow:_0px_0px_10px_rgb(255_255_255_/_1.00)]',
        secondary: 'dark:[text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.44)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
)

export interface ActionButtonProps extends VariantProps<typeof actionButtonVariants> {
  variant: 'primary' | 'secondary' | null | undefined
  icon: string
  children: ReactNode
  onClick?: () => void
  className?: string
}

export const ActionButton = ({
  variant,
  icon,
  children,
  className,
  onClick,
}: ActionButtonProps) => {
  const buttonRef = useRef<HTMLDivElement>(null)

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick?.()
    }
  }

  const isCommandMenuOpen = useCommandMenuOpen()
  useKey(icon.toLowerCase(), () => !isCommandMenuOpen && onClick?.(), { event: 'keydown' }, [
    isCommandMenuOpen,
    onClick,
  ])

  return (
    <div
      className={cn(actionButtonVariants({ variant }), className)}
      onClick={onClick}
      onKeyDown={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={typeof children === 'string' ? children : undefined}
      ref={buttonRef}
    >
      <div className={cn(iconVariants({ variant }), '[@media(pointer:coarse)]:hidden')}>
        <div className="text-center justify-center text-neutral-50 text-xs font-normal leading-none dark:[text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.25)]">
          {icon}
        </div>
      </div>
      <div className={textVariants({ variant })}>{children}</div>
    </div>
  )
}
