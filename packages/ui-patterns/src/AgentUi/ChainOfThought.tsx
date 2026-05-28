'use client'

import { Check, ChevronDown, Dot, Loader2, type LucideIcon } from 'lucide-react'
import {
  createContext,
  memo,
  useContext,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import { useControllableOpen } from './useControllableOpen'

interface ChainOfThoughtContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(null)

function useChainOfThought() {
  const context = useContext(ChainOfThoughtContext)
  if (!context) {
    throw new Error('ChainOfThought components must be used within ChainOfThought')
  }
  return context
}

type ChainOfThoughtProps = ComponentProps<'div'> & {
  children: ReactNode
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

const ChainOfThought = memo(function ChainOfThought({
  children,
  className,
  defaultOpen = false,
  onOpenChange,
  open,
  ...props
}: ChainOfThoughtProps) {
  const [isOpen, setIsOpen] = useControllableOpen({
    defaultOpen,
    onOpenChange,
    open,
  })

  const contextValue = useMemo(
    () => ({
      isOpen,
      setIsOpen,
    }),
    [isOpen, setIsOpen]
  )

  return (
    <ChainOfThoughtContext value={contextValue}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </Collapsible>
    </ChainOfThoughtContext>
  )
})

type ChainOfThoughtHeaderProps = ComponentProps<typeof CollapsibleTrigger>

const ChainOfThoughtHeader = memo(function ChainOfThoughtHeader({
  children,
  className,
  ...props
}: ChainOfThoughtHeaderProps) {
  const { isOpen } = useChainOfThought()

  return (
    <CollapsibleTrigger
      className={cn(
        'flex w-full items-center gap-2 text-left text-xs text-foreground-light transition-colors',
        'hover:text-foreground',
        className
      )}
      {...props}
    >
      <span className="flex-1">{children ?? 'Chain of thought'}</span>
      <ChevronDown
        size={14}
        className={cn('shrink-0 text-foreground-muted transition-transform', isOpen && 'rotate-180')}
      />
    </CollapsibleTrigger>
  )
})

type StepStatus = 'active' | 'complete' | 'pending'

type ChainOfThoughtStepProps = ComponentProps<'div'> & {
  description?: ReactNode
  icon?: LucideIcon
  label: ReactNode
  status?: StepStatus
}

const stepStatusStyles: Record<StepStatus, string> = {
  active: 'text-foreground-light',
  complete: 'text-foreground-muted',
  pending: 'text-foreground-lighter',
}

function StepIcon({
  icon: Icon,
  status,
}: {
  icon: LucideIcon
  status: StepStatus
}) {
  if (status === 'active') {
    return <Loader2 size={14} className="shrink-0 animate-spin text-foreground-muted" />
  }

  if (status === 'complete') {
    return <Check size={14} className="shrink-0 text-foreground-muted" />
  }

  return <Icon size={14} className="shrink-0 text-foreground-lighter" strokeWidth={1.5} />
}

const ChainOfThoughtStep = memo(function ChainOfThoughtStep({
  children,
  className,
  description,
  icon: Icon = Dot,
  label,
  status = 'complete',
  ...props
}: ChainOfThoughtStepProps) {
  return (
    <div className={cn('relative flex gap-2 py-1.5', className)} {...props}>
      <div className="mt-0.5">
        <StepIcon icon={Icon} status={status} />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className={cn('text-xs', stepStatusStyles[status])}>{label}</p>
        {description && (
          <p className="text-xs text-foreground-lighter">{description}</p>
        )}
        {children}
      </div>
    </div>
  )
})

type ChainOfThoughtContentProps = ComponentProps<typeof CollapsibleContent>

const ChainOfThoughtContent = memo(function ChainOfThoughtContent({
  children,
  className,
  ...props
}: ChainOfThoughtContentProps) {
  return (
    <CollapsibleContent
      className={cn('space-y-0.5 border-l border-default pl-3', className)}
      {...props}
    >
      {children}
    </CollapsibleContent>
  )
})

export {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
  useChainOfThought,
}
export type {
  ChainOfThoughtContentProps,
  ChainOfThoughtHeaderProps,
  ChainOfThoughtProps,
  ChainOfThoughtStepProps,
  StepStatus,
}
