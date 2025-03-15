import { cva, type VariantProps } from 'class-variance-authority'
import { KeyboardEvent, ReactNode, useEffect, useRef } from 'react'

const actionButtonVariants = cva(
  'pl-1.5 pr-3 py-1.5 rounded shadow flex justify-center items-center gap-2 outline outline-1 outline-offset-[-1px] cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-b from-emerald-400/0 via-emerald-400/30 to-emerald-400/0 shadow-[0px_0px_6px_0px_rgba(44,244,148,0.40)] outline-emerald-400/60',
        secondary: 'bg-gradient-to-b from-neutral-600/0 via-neutral-600/30 to-neutral-600/0 shadow-[0px_0px_6px_0px_rgba(255,255,255,0.10)] outline-white/10',
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
  'justify-center text-white text-xs font-normal leading-none min-w-[108.25px]',
  {
    variants: {
      variant: {
        primary: '[text-shadow:_0px_0px_10px_rgb(255_255_255_/_1.00)]',
        secondary: '[text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.44)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
)

export interface ActionButtonProps extends VariantProps<typeof actionButtonVariants> {
  icon: string
  children: ReactNode
  onClick?: () => void
}

export const ActionButton = ({ 
  variant, 
  icon, 
  children, 
  onClick 
}: ActionButtonProps) => {
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key.toLowerCase() === icon.toLowerCase()) {
        onClick?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [icon, onClick])

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick?.()
    }
  }

  return (
    <div 
      className={actionButtonVariants({ variant })}
      onClick={onClick}
      onKeyDown={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={typeof children === 'string' ? children : undefined}
      ref={buttonRef}
    >
      <div className={iconVariants({ variant })}>
        <div className="text-center justify-center text-neutral-50 text-xs font-normal leading-none [text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.25)]">
          {icon}
        </div>
      </div>
      <div className={textVariants({ variant })}>
        {children}
      </div>
    </div>
  )
}
