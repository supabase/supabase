import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import * as Sentry from '@sentry/nextjs'
import { Button } from 'ui'
import { AlertTriangle } from 'lucide-react'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
  message?: string
  actions?: {
    label: string
    onClick: () => void
  }[]
  sentryContext?: Record<string, any>
}

const ErrorFallback = ({
  error,
  resetErrorBoundary,
  message = 'Something went wrong',
  actions = [],
}: ErrorFallbackProps) => {
  return (
    <div className="p-4 bg-destructive-foreground h-full flex flex-col justify-center items-center">
      <div className="flex flex-col gap-2 border border-foreground/20 bg-background rounded-md p-4">
        <span className="text-destructive">
          <AlertTriangle />
        </span>
        <h3 className="text-foreground">{message}</h3>
        <p className="mt-2 text-sm text-foreground/50">
          We've been notified and are working to fix this issue.
        </p>
        <div className="mt-4 flex gap-2">
          <Button type="default" onClick={resetErrorBoundary} className="text-sm">
            Try again
          </Button>
          {actions?.map((action, index) => (
            <Button key={index} type="default" onClick={action.onClick} className="text-sm">
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  message?: string
  actions?: {
    label: string
    onClick: () => void
  }[]
  sentryContext?: Record<string, any>
  onReset?: () => void
}

export const ErrorBoundary = ({
  children,
  fallback,
  message,
  actions,
  sentryContext,
  onReset,
}: ErrorBoundaryProps) => {
  const handleError = (error: Error, info: { componentStack: string }) => {
    Sentry.withScope((scope) => {
      scope.setExtra('componentStack', info.componentStack)
      if (sentryContext) {
        Object.entries(sentryContext).forEach(([key, value]) => {
          scope.setExtra(key, value)
        })
      }
      Sentry.captureException(error)
    })
  }

  const handleReset = () => {
    onReset?.()
  }

  return (
    <ReactErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          message={message}
          actions={actions}
        />
      )}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ReactErrorBoundary>
  )
}
