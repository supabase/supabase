'use client'

import { Brain, ChevronDown, Loader2 } from 'lucide-react'
import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import { useControllableOpen } from './useControllableOpen'

const AUTO_CLOSE_DELAY_MS = 1000

interface ReasoningContextValue {
  duration: number | undefined
  isOpen: boolean
  isStreaming: boolean
  setIsOpen: (open: boolean) => void
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null)

function useReasoning() {
  const context = useContext(ReasoningContext)
  if (!context) {
    throw new Error('Reasoning components must be used within Reasoning')
  }
  return context
}

type ReasoningProps = ComponentProps<'div'> & {
  children: ReactNode
  defaultOpen?: boolean
  duration?: number
  isStreaming?: boolean
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

const Reasoning = memo(function Reasoning({
  children,
  className,
  defaultOpen,
  duration: durationProp,
  isStreaming = false,
  onOpenChange,
  open,
  ...props
}: ReasoningProps) {
  const resolvedDefaultOpen = defaultOpen ?? isStreaming
  const isExplicitlyClosed = defaultOpen === false

  const [isOpen, setIsOpen] = useControllableOpen({
    defaultOpen: resolvedDefaultOpen,
    onOpenChange,
    open,
  })

  const [duration, setDuration] = useState<number | undefined>(durationProp)
  const hasEverStreamedRef = useRef(isStreaming)
  const [hasAutoClosed, setHasAutoClosed] = useState(false)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (durationProp !== undefined) {
      setDuration(durationProp)
    }
  }, [durationProp])

  useEffect(() => {
    if (isStreaming) {
      hasEverStreamedRef.current = true
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now()
      }
      return
    }

    if (startTimeRef.current !== null) {
      setDuration(Math.max(1, Math.ceil((Date.now() - startTimeRef.current) / 1000)))
      startTimeRef.current = null
    }
  }, [isStreaming])

  useEffect(() => {
    if (isStreaming && !isOpen && !isExplicitlyClosed) {
      setIsOpen(true)
    }
  }, [isExplicitlyClosed, isOpen, isStreaming, setIsOpen])

  useEffect(() => {
    if (!hasEverStreamedRef.current || isStreaming || !isOpen || hasAutoClosed) {
      return
    }

    const timer = window.setTimeout(() => {
      setIsOpen(false)
      setHasAutoClosed(true)
    }, AUTO_CLOSE_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [hasAutoClosed, isOpen, isStreaming, setIsOpen])

  const contextValue = useMemo(
    () => ({
      duration,
      isOpen,
      isStreaming,
      setIsOpen,
    }),
    [duration, isOpen, isStreaming, setIsOpen]
  )

  return (
    <ReasoningContext value={contextValue}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </Collapsible>
    </ReasoningContext>
  )
})

type ReasoningTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode
}

function defaultGetThinkingMessage(isStreaming: boolean, duration?: number) {
  if (isStreaming || duration === 0) {
    return 'Thinking...'
  }

  if (duration === undefined) {
    return 'Finished thinking'
  }

  return `Thought for ${duration}s`
}

const ReasoningTrigger = memo(function ReasoningTrigger({
  children,
  className,
  getThinkingMessage = defaultGetThinkingMessage,
  ...props
}: ReasoningTriggerProps) {
  const { duration, isOpen, isStreaming } = useReasoning()

  return (
    <CollapsibleTrigger
      className={cn(
        'flex w-full items-center gap-2 rounded-md border border-default bg-surface-100 px-3 py-2',
        'text-left text-xs text-foreground-light transition-colors hover:bg-surface-200',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          {isStreaming ? (
            <Loader2 size={14} className="shrink-0 animate-spin text-foreground-muted" />
          ) : (
            <Brain size={14} className="shrink-0 text-foreground-muted" />
          )}
          <span className="flex-1">{getThinkingMessage(isStreaming, duration)}</span>
          <ChevronDown
            size={14}
            className={cn(
              'shrink-0 text-foreground-muted transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </>
      )}
    </CollapsibleTrigger>
  )
})

type ReasoningContentProps = ComponentProps<typeof CollapsibleContent>

const ReasoningContent = memo(function ReasoningContent({
  children,
  className,
  ...props
}: ReasoningContentProps) {
  return (
    <CollapsibleContent className={cn('mt-2 px-1 text-xs text-foreground-lighter', className)} {...props}>
      {children}
    </CollapsibleContent>
  )
})

export { Reasoning, ReasoningContent, ReasoningTrigger, useReasoning }
export type { ReasoningProps, ReasoningContentProps, ReasoningTriggerProps }
