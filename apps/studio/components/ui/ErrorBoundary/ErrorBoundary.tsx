import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import * as Sentry from '@sentry/nextjs'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Button } from 'ui'
import { AlertCircle } from 'lucide-react'
import { ErrorInfo } from 'react'

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
      <Alert_Shadcn_ variant="destructive">
        <AlertCircle />
        <AlertTitle_Shadcn_>{message}</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>
          We've been notified and will review and fix this issue.
        </AlertDescription_Shadcn_>
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
      </Alert_Shadcn_>
    </div>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode
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
  message,
  actions,
  sentryContext,
  onReset,
}: ErrorBoundaryProps) => {
  const handleError = (error: Error, info: ErrorInfo) => {
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
