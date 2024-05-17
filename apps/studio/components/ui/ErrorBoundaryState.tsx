import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { Button } from 'ui'

type ErrorBoundaryStateProps = {
  error: Error
  componentStack: string
  eventId: string
  resetError(): void
  pathname: string
}

export const ErrorBoundaryState = ({
  pathname,
  error,
  componentStack,
  resetError,
}: ErrorBoundaryStateProps) => {
  const message = `Path name: ${pathname}\n\n${componentStack}`

  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col gap-y-3">
      <div className="flex items-center flex-col gap-y-1">
        <p className="text-sm">
          Application error: a client-side exception has occurred (see browser console for more
          information)
        </p>
        <p className="text-sm text-foreground-light">Error: {(error as any).message}</p>
      </div>

      <div className="flex items-center justify-center gap-x-2">
        <Button asChild type="default" icon={<ExternalLink />}>
          <Link
            href={`/support/new?category=dashboard_bug&subject=Client%20side%20exception%20occured%20on%20dashboard&message=${encodeURI(message)}`}
            target="_blank"
          >
            Report to support
          </Link>
        </Button>
        {/* [Joshen] For local and staging, allow us to escape the error boundary */}
        {/* We could actually investigate how to make this available on prod, but without being able to reliably test this, I'm not keen to do it now */}
        {process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod' && (
          <Button type="outline" onClick={() => resetError()}>
            Return to dashboard
          </Button>
        )}
      </div>
    </div>
  )
}
