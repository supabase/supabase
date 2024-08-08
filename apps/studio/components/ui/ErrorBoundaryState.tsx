import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { FallbackProps } from 'react-error-boundary'

import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { WarningIcon } from 'ui'

export const ErrorBoundaryState = ({ error, resetErrorBoundary }: FallbackProps) => {
  const router = useRouter()
  const message = `Path name: ${router.pathname}\n\n${error.stack}`
  const isRemoveChildError = error.message.includes("Failed to execute 'removeChild' on 'Node'")

  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col gap-y-3">
      <div className="flex items-center flex-col gap-y-1">
        <p className="text-sm">
          Application error: a client-side exception has occurred (see browser console for more
          information)
        </p>
        <p className="text-sm text-foreground-light">Error: {error.message}</p>
      </div>

      {isRemoveChildError && (
        <Alert_Shadcn_ className="w-[650px]">
          <WarningIcon />
          <AlertTitle_Shadcn_>
            This error might be caused by Google translate or third-party browser extensions
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            You may try to avoid using Google translate or disable certain browser extensions to
            avoid running into the <code className="text-xs">'removeChild' on 'Node'</code> error.
          </AlertDescription_Shadcn_>
          <AlertDescription_Shadcn_ className="mt-3">
            <Button asChild type="default" icon={<ExternalLink />}>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://github.com/facebook/react/issues/17256"
              >
                More information
              </a>
            </Button>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}

      <div className="flex items-center justify-center gap-x-2">
        <Button asChild type="default" icon={<ExternalLink />}>
          <Link
            href={`/support/new?category=dashboard_bug&subject=Client%20side%20exception%20occurred%20on%20dashboard&message=${encodeURI(message)}`}
            target="_blank"
          >
            Report to support
          </Link>
        </Button>
        {/* [Joshen] For local and staging, allow us to escape the error boundary */}
        {/* We could actually investigate how to make this available on prod, but without being able to reliably test this, I'm not keen to do it now */}
        {process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod' ? (
          <Button type="outline" onClick={() => resetErrorBoundary()}>
            Return to dashboard
          </Button>
        ) : (
          <Button type="outline" onClick={() => router.reload()}>
            Reload dashboard
          </Button>
        )}
      </div>
    </div>
  )
}
