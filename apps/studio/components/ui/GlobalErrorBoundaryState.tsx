import { isError } from 'lodash'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import CopyButton from './CopyButton'

import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'

// More correct version of FallbackProps from react-error-boundary
export type FallbackProps = {
  error: unknown
  resetErrorBoundary: (...args: any[]) => void
}

export const GlobalErrorBoundaryState = ({ error, resetErrorBoundary }: FallbackProps) => {
  const router = useRouter()
  const checkIsError = isError(error)

  const errorMessage = checkIsError ? error.message : ''
  const urlMessage = checkIsError ? `Path name: ${router.pathname}\n\n${error?.stack}` : ''
  const isRemoveChildError = checkIsError
    ? errorMessage.includes("Failed to execute 'removeChild' on 'Node'")
    : false

  function handleClearStorage() {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (e) {
      // ignore
    }
    window.location.reload()
  }

  return (
    <div className="w-screen mx-auto h-screen flex items-center justify-center flex-col gap-y-4 max-w-[650px]">
      <div className="flex flex-col gap-y-1 text-left p-2">
        <p className="mt-1">
          Application error: a client-side exception has occurred (see browser console for more
          information)
        </p>
        <p className="text-foreground-light">{errorMessage}</p>
        <div className="flex justify-end">
          <CopyButton type="outline" text={errorMessage} copyLabel="Copy error" />
        </div>
      </div>

      {isRemoveChildError ? (
        <Alert_Shadcn_>
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
      ) : (
        <Alert_Shadcn_>
          <AlertTitle_Shadcn_>Recommended steps to resolve this error:</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <ul className="list-disc list-inside text-sm space-y-1 [&_b]:font-medium [&_b]:text-foreground">
              <li>
                Try accessing the dashboard in an <b>incognito/private window</b>.
              </li>
              <li>Try a different browser to see if the issue persists.</li>
              <li>
                Sign out and sign back in (use the <b>Force sign out</b> button below).
              </li>
              <li>
                Clear your browser storage (use the <b>Clear browser storage</b> button below).
              </li>
              <li>
                Disable browser extensions, especially those that modify page content (e.g., Google
                Translate).
              </li>
              <li>If the problem continues, please report it to support with the button below.</li>
            </ul>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="default" icon={<ExternalLink />}>
          <Link
            href={`/support/new?category=dashboard_bug&subject=Client%20side%20exception%20occurred%20on%20dashboard&message=${encodeURI(urlMessage)}`}
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

        <Button type="outline" onClick={() => router.push('/logout')}>
          Force sign out
        </Button>

        <Button type="outline" onClick={handleClearStorage}>
          Clear browser storage
        </Button>
      </div>
    </div>
  )
}
