'use client'

import { Check, ChevronRight, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  alertVariants,
  Button,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  copyToClipboard,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'ui'

import { AdmonitionTypeIcon } from '../Admonition/AdmonitionIcons'
import { TYPE_STYLES } from './ErrorDisplay.constants'
import type {
  ErrorDisplayDetails,
  ErrorDisplayProps,
  ErrorDisplayStep,
  ErrorDisplayType,
} from './ErrorDisplay.types'
import {
  buildSupportUrl,
  formatErrorDetails,
  formatTimestamp,
  isExternalHref,
  resolveSize,
  useContainerWidth,
  useRetry,
} from './ErrorDisplay.utils'

function CopyErrorDetailsButton({ error, title }: { error: ErrorDisplayDetails; title: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <Button
      size="tiny"
      variant="text"
      className="-mr-1 -mt-1 shrink-0 px-1"
      aria-label={copied ? 'Error details copied' : 'Copy error details'}
      icon={copied ? <Check /> : <Copy />}
      onClick={() => copyToClipboard(formatErrorDetails(error, title), () => setCopied(true))}
    />
  )
}

function ErrorDetailsPanel({
  error,
  title,
  type,
  className,
}: {
  error: ErrorDisplayDetails
  title: string
  type: ErrorDisplayType
  className?: string
}) {
  const style = TYPE_STYLES[type]
  const meta = [
    error.code && (['Code', error.code] as const),
    error.requestId && (['Request ID', error.requestId] as const),
    error.timestamp && (['Time', formatTimestamp(error.timestamp)] as const),
  ].filter(Boolean) as (readonly [string, string])[]

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border px-2.5 py-2',
        style.border,
        style.surface,
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <pre
          className={cn(
            'max-h-32 overflow-auto whitespace-pre-wrap wrap-break-word font-mono text-xs normal-case',
            style.mono
          )}
        >
          {error.message}
        </pre>
        {meta.length > 0 && (
          <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {meta.map(([label, value]) => (
              <div key={label} className="flex min-w-0 items-baseline gap-1.5">
                <dt className="shrink-0 text-xs text-foreground-lighter">{label}</dt>
                <dd className="truncate font-mono text-xs text-foreground-light">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <CopyErrorDetailsButton error={error} title={title} />
    </div>
  )
}

function ErrorDetailsDisclosure(props: {
  error: ErrorDisplayDetails
  title: string
  type: ErrorDisplayType
}) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded-xs py-1 text-xs text-foreground-light transition-colors hover:text-foreground focus-ring">
        <ChevronRight
          aria-hidden
          size={12}
          className="shrink-0 transition-transform group-data-open:rotate-90"
        />
        Details
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ErrorDetailsPanel {...props} className="mt-1.5" />
      </CollapsibleContent>
    </Collapsible>
  )
}

function RetryButton({
  onRetry,
  label,
  iconOnly,
}: {
  onRetry: () => void | Promise<void>
  label: string
  iconOnly?: boolean
}) {
  const { isRetrying, retry } = useRetry(onRetry)
  const retryingLabel = 'Retrying...'

  return (
    <Button
      size="tiny"
      className={cn('shrink-0', iconOnly && 'px-1')}
      aria-label={iconOnly ? (isRetrying ? retryingLabel : label) : undefined}
      loading={isRetrying}
      icon={iconOnly || !isRetrying ? <RefreshCw /> : undefined}
      onClick={retry}
    >
      {iconOnly ? undefined : isRetrying ? retryingLabel : label}
    </Button>
  )
}

function StepAction({ step, block }: { step: ErrorDisplayStep; block?: boolean }) {
  const { action } = step
  const [isRunning, setIsRunning] = useState(false)

  if (action.render) return <>{action.render({ block })}</>

  const run = async () => {
    setIsRunning(true)
    try {
      await action.onClick?.()
    } finally {
      setIsRunning(false)
    }
  }

  if (action.href) {
    const external = isExternalHref(action.href)
    return (
      <Button
        asChild
        size="tiny"
        block={block}
        icon={action.icon}
        iconRight={external ? <ExternalLink /> : undefined}
      >
        <a
          href={action.href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          onClick={action.onClick}
        >
          {action.label}
        </a>
      </Button>
    )
  }

  return (
    <Button size="tiny" block={block} icon={action.icon} loading={isRunning} onClick={run}>
      {action.label}
    </Button>
  )
}

function StepsTimeline({
  steps,
  defaultOpenStep,
  onStepOpenChange,
  type,
}: {
  steps: ErrorDisplayStep[]
  defaultOpenStep?: string
  onStepOpenChange?: (stepId: string | null) => void
  type: ErrorDisplayType
}) {
  const [openStep, setOpenStep] = useState<string>(defaultOpenStep ?? steps[0]?.id ?? '')

  return (
    <Accordion
      type="single"
      collapsible
      value={openStep}
      onValueChange={(value) => {
        setOpenStep(value)
        onStepOpenChange?.(value || null)
      }}
      className="w-full"
    >
      {steps.map((step, index) => (
        <AccordionItem key={step.id} value={step.id} className="relative border-0">
          {index < steps.length - 1 && (
            <span
              aria-hidden
              className={cn('absolute bottom-0 left-3 top-9 w-px', TYPE_STYLES[type].divider)}
            />
          )}
          <AccordionTrigger className="gap-3 py-2.5 hover:no-underline">
            <span className="flex min-w-0 items-center gap-3 text-left">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-button-hover bg-button font-mono text-xs font-medium tabular-nums text-foreground">
                {index + 1}
              </span>
              <span className="min-w-0 text-sm font-medium text-foreground">{step.title}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="[&>div]:pb-3 [&>div]:pt-0">
            <div className="pl-9">
              {step.description && (
                <p className="mb-2.5 text-sm text-foreground-light">{step.description}</p>
              )}
              <StepAction step={step} />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

function SupportFooter({
  href,
  label,
  onClick,
  compact,
  className,
}: {
  href: string
  label: string
  onClick: () => void
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-foreground-light',
        compact ? 'text-xs' : 'text-sm',
        className
      )}
    >
      <span>Still stuck?</span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className="rounded-xs text-foreground underline underline-offset-2 transition-colors hover:text-foreground-light focus-ring"
      >
        {label}
      </a>
    </div>
  )
}

export const ErrorDisplay = forwardRef<HTMLDivElement, ErrorDisplayProps>(
  (
    {
      type = 'info',
      size = 'auto',
      title,
      description,
      error,
      onRetry,
      retryLabel = 'Try again',
      steps,
      defaultOpenStep,
      onStepOpenChange,
      onContactSupport,
      supportHref,
      supportFormParams,
      supportLabel = 'Contact support',
      icon,
      children,
      className,
      onRender,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const width = useContainerWidth(containerRef)
    const resolvedSize = resolveSize(size, width)
    const titleId = useId()

    const hasFired = useRef(false)
    useEffect(() => {
      if (hasFired.current) return
      hasFired.current = true
      onRender?.()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const href = supportHref ?? buildSupportUrl(supportFormParams, error, title)
    const handleSupportClick = () => onContactSupport?.(error)

    const visibleSteps = steps ?? []
    const isNumbered = visibleSteps.length > 1
    const admonitionType = TYPE_STYLES[type].admonition

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref]
    )

    const isCompact = resolvedSize === 'compact'

    return (
      <div
        ref={setRefs}
        role={TYPE_STYLES[type].role}
        aria-labelledby={titleId}
        data-size={resolvedSize}
        className={cn(
          alertVariants({ variant: TYPE_STYLES[type].variant }),
          'w-auto min-w-0 overflow-hidden p-0',
          className
        )}
        {...props}
      >
        <div
          className={cn('flex items-start gap-3', isCompact ? 'px-3 pb-2 pt-3' : 'px-4 pb-3 pt-4')}
        >
          {icon ?? <AdmonitionTypeIcon type={admonitionType} />}
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="mt-0.5 text-sm font-medium text-foreground">
              {title}
            </h3>
            {description && (
              <p
                className={cn(
                  'mt-1 text-foreground-light',
                  isCompact ? 'text-xs' : 'text-sm',
                  isCompact && 'line-clamp-2'
                )}
              >
                {description}
              </p>
            )}
          </div>
          {onRetry && <RetryButton onRetry={onRetry} label={retryLabel} iconOnly={isCompact} />}
        </div>

        {isCompact ? (
          <div className="flex flex-col gap-4 px-3 pb-3">
            {error && <ErrorDetailsDisclosure error={error} title={title} type={type} />}

            {visibleSteps.length > 0 && (
              <TooltipProvider delayDuration={200}>
                <div className="flex flex-col gap-1.5">
                  {visibleSteps.map((step) =>
                    step.description ? (
                      <Tooltip key={step.id}>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <StepAction step={step} block />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-56">
                          {step.description}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <StepAction key={step.id} step={step} block />
                    )
                  )}
                </div>
              </TooltipProvider>
            )}

            {children}

            <SupportFooter compact href={href} label={supportLabel} onClick={handleSupportClick} />
          </div>
        ) : (
          <>
            {error && (
              <ErrorDetailsPanel error={error} title={title} type={type} className="mx-4 mb-3" />
            )}

            {visibleSteps.length > 0 && (
              <div className="px-4 pb-3">
                {isNumbered ? (
                  <StepsTimeline
                    steps={visibleSteps}
                    defaultOpenStep={defaultOpenStep}
                    onStepOpenChange={onStepOpenChange}
                    type={type}
                  />
                ) : (
                  <div className="py-1">
                    {visibleSteps[0].description && (
                      <p className="mb-2.5 text-sm text-foreground-light">
                        {visibleSteps[0].description}
                      </p>
                    )}
                    <StepAction step={visibleSteps[0]} />
                  </div>
                )}
              </div>
            )}

            {children}

            <SupportFooter
              href={href}
              label={supportLabel}
              onClick={handleSupportClick}
              className="px-4 pb-3"
            />
          </>
        )}
      </div>
    )
  }
)

ErrorDisplay.displayName = 'ErrorDisplay'
