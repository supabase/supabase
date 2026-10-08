'use client'

import { ChevronDown, ExternalLink, RefreshCw } from 'lucide-react'
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  alertVariants,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'ui'

import { AdmonitionTypeIcon } from '../Admonition/AdmonitionIcons'
import { TYPE_STYLES } from './ErrorDisplay.constants'
import type {
  ErrorDisplayAction,
  ErrorDisplayDetails,
  ErrorDisplayProps,
  ErrorDisplayStep,
  ErrorDisplayType,
} from './ErrorDisplay.types'
import {
  buildSupportUrl,
  formatTimestamp,
  isExternalHref,
  resolveSize,
  useContainerWidth,
  useRetry,
} from './ErrorDisplay.utils'

function ErrorDetails({ error }: { error: ErrorDisplayDetails }) {
  const messageRef = useRef<HTMLPreElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const details = [
    error.message,
    error.code && `Code: ${error.code}`,
    error.requestId && `Request ID: ${error.requestId}`,
    error.timestamp && `Time: ${formatTimestamp(error.timestamp)}`,
  ]
    .filter(Boolean)
    .join('\n')

  useEffect(() => {
    const message = messageRef.current
    if (!message || isExpanded) return

    const updateOverflow = () => setHasOverflow(message.scrollHeight > message.clientHeight)
    updateOverflow()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateOverflow)
    observer.observe(message)
    return () => observer.disconnect()
  }, [details, isExpanded])

  return (
    <div className="mt-2 min-w-0 overflow-hidden rounded-md border border-default bg-surface-100 px-2.5 py-2 text-xs text-foreground-light">
      <pre
        ref={messageRef}
        className={cn(
          'whitespace-pre-wrap wrap-break-word font-mono text-xs normal-case text-foreground-light',
          isExpanded ? 'max-h-64 overflow-auto' : 'max-h-20 overflow-hidden'
        )}
      >
        {details}
      </pre>
      {(hasOverflow || isExpanded) && (
        <div
          className={cn(
            'relative z-10 -mx-2.5 -mb-2 flex px-2.5 pb-2',
            !isExpanded && '-mt-8 bg-gradient-to-t pt-8',
            !isExpanded && 'from-surface-100 via-surface-100/95'
          )}
        >
          <Button
            size="tiny"
            variant="text"
            className="-ml-1 h-auto px-1 py-0.5"
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        </div>
      )}
    </div>
  )
}

function RetryButton({
  onRetry,
  label,
  className,
}: {
  onRetry: () => void | Promise<void>
  label: string
  className?: string
}) {
  const { isRetrying, retry } = useRetry(onRetry)
  const retryingLabel = 'Retrying...'

  return (
    <Button
      size="tiny"
      className={className}
      loading={isRetrying}
      icon={!isRetrying ? <RefreshCw /> : undefined}
      onClick={retry}
    >
      {isRetrying ? retryingLabel : label}
    </Button>
  )
}

function RecoveryActionButton({
  action,
  block,
  className,
}: {
  action: ErrorDisplayAction
  block?: boolean
  className?: string
}) {
  const [isRunning, setIsRunning] = useState(false)

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
      <Button asChild size="tiny" block={block} icon={action.icon} className={className}>
        <a
          href={action.href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          onClick={() => void action.onClick?.()}
        >
          {action.label}
        </a>
      </Button>
    )
  }

  return (
    <Button
      size="tiny"
      block={block}
      icon={action.icon}
      loading={isRunning}
      className={className}
      onClick={run}
    >
      {action.label}
    </Button>
  )
}

function RecoveryActions({
  actions,
  onRetry,
  retryLabel,
  supportHref,
  supportLabel,
  onContactSupport,
}: {
  actions: ErrorDisplayAction[]
  onRetry?: () => void | Promise<void>
  retryLabel: string
  supportHref: string
  supportLabel: string
  onContactSupport: () => void
}) {
  const primaryAction = onRetry ? undefined : actions[0]
  const secondaryActions = onRetry ? actions : actions.slice(1)
  const hasPrimaryAction = !!onRetry || !!primaryAction
  const primaryClassName = 'rounded-r-none hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm'

  if (!hasPrimaryAction) {
    return (
      <Button asChild size="tiny">
        <a href={supportHref} target="_blank" rel="noopener noreferrer" onClick={onContactSupport}>
          {supportLabel}
        </a>
      </Button>
    )
  }

  return (
    <div className="flex">
      {hasPrimaryAction && (
        <div>
          {onRetry ? (
            <RetryButton onRetry={onRetry} label={retryLabel} className={primaryClassName} />
          ) : (
            primaryAction && (
              <RecoveryActionButton action={primaryAction} className={primaryClassName} />
            )
          )}
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="tiny"
            className={cn(
              'shrink-0 px-[4px] py-[5px]',
              hasPrimaryAction &&
                'rounded-l-none -ml-px focus-visible:z-10 focus-visible:rounded-l-sm'
            )}
            icon={<ChevronDown />}
            aria-label="More troubleshooting options"
          >
            {!hasPrimaryAction && 'Get help'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {secondaryActions.map((action) =>
            action.href ? (
              <DropdownMenuItem key={action.id} asChild>
                <a
                  href={action.href}
                  target={isExternalHref(action.href) ? '_blank' : undefined}
                  rel={isExternalHref(action.href) ? 'noopener noreferrer' : undefined}
                  onClick={() => void action.onClick?.()}
                >
                  {action.label}
                </a>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem key={action.id} onSelect={() => void action.onClick?.()}>
                {action.label}
              </DropdownMenuItem>
            )
          )}
          {secondaryActions.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem asChild>
            <a
              href={supportHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onContactSupport}
            >
              {supportLabel}
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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

export const ErrorDisplay = forwardRef<HTMLDivElement, ErrorDisplayProps>(
  (
    {
      type = 'info',
      title,
      description,
      error,
      onRetry,
      retryLabel = 'Try again',
      actions,
      steps,
      defaultOpenStep,
      onStepOpenChange,
      onContactSupport,
      supportHref,
      supportFormParams,
      supportLabel = 'Contact support',
      icon,
      showIcon = true,
      children,
      className,
      onRender,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const width = useContainerWidth(containerRef)
    const resolvedSize = resolveSize(width)
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
    const hasSupplementalContent = visibleSteps.length > 0 || !!children
    const hasSupportingContent = !!description || !!error

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
          '@container w-auto min-w-0 overflow-hidden p-0',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'flex gap-3 px-4 pb-3 pt-4',
            hasSupportingContent ? 'items-start' : 'items-center'
          )}
        >
          {showIcon && (icon ?? <AdmonitionTypeIcon type={admonitionType} />)}
          <div
            className={cn('flex min-w-0 flex-1 flex-col', [
              '@md:flex-row @md:items-center @md:justify-between',
              '@md:gap-x-6 @lg:gap-x-8',
            ])}
          >
            <div className={cn('min-w-0 flex-1', showIcon && hasSupportingContent && 'mt-0.5')}>
              <h3 id={titleId} className="text-sm font-medium text-foreground">
                {title}
              </h3>
              {description && <p className="mt-1 text-sm text-foreground-light">{description}</p>}
              {error && <ErrorDetails error={error} />}
            </div>
            <div className="mt-3 flex flex-row items-start @md:mt-0 @md:items-center">
              <RecoveryActions
                actions={actions ?? []}
                onRetry={onRetry}
                retryLabel={retryLabel}
                supportHref={href}
                supportLabel={supportLabel}
                onContactSupport={handleSupportClick}
              />
            </div>
          </div>
        </div>

        {hasSupplementalContent && (
          <div className="flex flex-col gap-3 px-4 pb-3">
            {visibleSteps.length > 0 &&
              (isCompact ? (
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
              ) : (
                <div>
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
              ))}

            {children}
          </div>
        )}
      </div>
    )
  }
)

ErrorDisplay.displayName = 'ErrorDisplay'
