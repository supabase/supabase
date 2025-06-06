import { isError } from 'lodash'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import CopyButton from './CopyButton'

import Image from 'next/image'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
  cn,
} from 'ui'
import { InlineLinkClassName } from './InlineLink'

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

  const handleClearStorage = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (e) {
      // ignore
    }
    window.location.reload()
  }

  return (
    <div className="w-screen mx-auto h-screen flex items-center justify-center">
      <header className="h-12 absolute top-0 w-full border-b px-4 flex items-center">
        <Link href="/" className="items-center justify-center">
          <Image
            alt="Supabase"
            src={`${router.basePath}/img/supabase-logo.svg`}
            width={18}
            height={18}
            className="w-[18px] h-[18px]"
          />
        </Link>
      </header>

      <div className="flex flex-col gap-y-4 max-w-full sm:max-w-[660px] px-4 sm:px-0">
        <div className="flex flex-col gap-y-1 text-left py-2 w-full">
          <div className="flex items-center justify-between mb-3">
            <p className="text-lg font-bold">Sorry! An unexpected error occurred.</p>
            <CopyButton type="outline" text={errorMessage} copyLabel="Copy error" />
          </div>
          <p className="text-sm">
            Application error: a client-side exception has occurred (see browser console for more
            information)
          </p>
          <p className="text-foreground-light text-sm">{errorMessage}</p>
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
            <AlertTitle_Shadcn_>We recommend trying the following:</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <ul className="list-disc pl-2 list-inside text-sm space-y-1 [&_b]:font-medium [&_b]:text-foreground">
                <li>
                  <span
                    className={cn(InlineLinkClassName, 'cursor-pointer')}
                    onClick={() => window.location.reload()}
                  >
                    Refresh
                  </span>{' '}
                  the page
                </li>
                <li>
                  <span
                    className={cn(InlineLinkClassName, 'cursor-pointer')}
                    onClick={() => router.push('/logout')}
                  >
                    Sign out
                  </span>{' '}
                  and sign back in
                </li>
                <li>
                  <span
                    className={cn(InlineLinkClassName, 'cursor-pointer')}
                    onClick={handleClearStorage}
                  >
                    Clear your browser storage
                  </span>{' '}
                  to clean potentially outdated data
                </li>
                <li>
                  Disable browser extensions that might modify page content (e.g., Google Translate)
                </li>
                <li>If the problem persists, please contact support for assistance</li>
              </ul>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}

        <div className="w-full sm:w-1/2 mx-auto grid grid-cols-2 gap-2">
          <Button asChild type="default" icon={<ExternalLink />}>
            <Link
              href={`/support/new?category=dashboard_bug&subject=Client%20side%20exception%20occurred%20on%20dashboard&message=${encodeURI(urlMessage)}`}
              target="_blank"
            >
              Contact support
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
    </div>
  )
}
