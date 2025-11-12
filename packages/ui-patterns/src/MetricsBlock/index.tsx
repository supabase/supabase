'use client'

import * as React from 'react'
import { useContext } from 'react'
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Card,
  CardTitle,
  cn,
  InfoIcon,
  CardContent,
} from 'ui'
import { ExternalLink, HelpCircle } from 'lucide-react'
import Link from 'next/link'

interface MetricsBlockContextValue {
  isLoading?: boolean
  isDisabled?: boolean
}

const MetricsBlockContext = React.createContext<MetricsBlockContextValue>({
  isLoading: false,
  isDisabled: false,
})

const useMetricsBlock = () => {
  return useContext(MetricsBlockContext)
}

interface MetricsBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean
  isDisabled?: boolean
}

const MetricsBlock = React.forwardRef<HTMLDivElement, MetricsBlockProps>(
  ({ isLoading = false, isDisabled = false, className, children, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn(className)} {...props}>
        <MetricsBlockContext.Provider value={{ isLoading, isDisabled }}>
          {children}
        </MetricsBlockContext.Provider>
      </Card>
    )
  }
)
MetricsBlock.displayName = 'MetricsBlock'

interface MetricsBlockHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean
  isDisabled?: boolean
  hasLink?: boolean
  href?: string
  children: React.ReactNode
}

const MetricsBlockHeader = React.forwardRef<HTMLDivElement, MetricsBlockHeaderProps>(
  ({ className, isLoading, isDisabled, hasLink = false, href, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'py-4 px-6 flex flex-row items-center justify-between gap-2 space-y-0 pb-0 border-b-0 relative',
        className
      )}
      {...props}
    >
      <div className="flex flex-row items-center gap-2">{children}</div>
      {hasLink && (
        <Button type="text" size="tiny" className="px-1 text-foreground-lighter" asChild>
          <Link href={href || ''}>
            <ExternalLink size={14} strokeWidth={1.5} />
          </Link>
        </Button>
      )}
    </div>
  )
)
MetricsBlockHeader.displayName = 'MetricsBlockHeader'

interface MetricsBlockContentProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

const MetricsBlockContent = React.forwardRef<HTMLDivElement, MetricsBlockContentProps>(
  ({ className, orientation = 'vertical', ...props }, ref) => (
    <CardContent
      ref={ref}
      className={cn(
        'pb-4 px-6 pt-0 flex-1 flex h-full items-start gap-1 overflow-hidden',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col ',
        className
      )}
      {...props}
    />
  )
)
MetricsBlockContent.displayName = 'MetricsBlockContent'

const MetricsBlockIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-foreground-light', className)} {...props} />
  )
)
MetricsBlockIcon.displayName = 'MetricsBlockIcon'

interface MetricsBlockLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean
  isDisabled?: boolean
  hasTooltip?: boolean
  tooltip?: string
  children: React.ReactNode
}

const MetricsBlockLabel = React.forwardRef<HTMLDivElement, MetricsBlockLabelProps>(
  ({ className, isLoading, isDisabled, hasTooltip = false, tooltip, children, ...props }, ref) => (
    <CardTitle
      ref={ref}
      className={cn('flex items-center gap-2 text-foreground-light', className)}
      {...props}
    >
      <span>{children}</span>
      {hasTooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle size={14} strokeWidth={1.5} />
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      )}
    </CardTitle>
  )
)
MetricsBlockLabel.displayName = 'MetricsBlockLabel'

const MetricsBlockValue = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn('font-normal text-xl tabular-nums', className)} {...props} />
  )
)
MetricsBlockValue.displayName = 'MetricsBlockValue'

interface MetricsBlockDifferentialProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'positive' | 'negative' | 'default'
}

const MetricsBlockDifferential = React.forwardRef<HTMLDivElement, MetricsBlockDifferentialProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        variant === 'positive'
          ? 'text-brand'
          : variant === 'negative'
            ? 'text-destructive'
            : 'text-foreground-light',
        'tabular-nums text-sm',
        className
      )}
      {...props}
    />
  )
)
MetricsBlockDifferential.displayName = 'MetricsBlockDifferential'

const MetricsBlockSparkline = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-foreground-light', className)} {...props} />
))
MetricsBlockSparkline.displayName = 'MetricsBlockSparkline'

export {
  MetricsBlock,
  MetricsBlockHeader,
  MetricsBlockIcon,
  MetricsBlockLabel,
  MetricsBlockContent,
  MetricsBlockValue,
  MetricsBlockDifferential,
  MetricsBlockSparkline,
  useMetricsBlock,
}
