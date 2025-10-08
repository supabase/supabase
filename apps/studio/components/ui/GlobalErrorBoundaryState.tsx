import { isError } from 'lodash'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import CopyButton from './CopyButton'

import Image from 'next/image'
import { Button, cn } from 'ui'
import { Admonition } from 'ui-patterns'
import { InlineLinkClassName } from './InlineLink'

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
  const isInsertBeforeError = checkIsError
    ? errorMessage.includes("Failed to execute 'insertBefore' on 'Node'")
    : false

  // Get Sentry issue ID from error if available
  const sentryIssueId = (!!error && typeof error === 'object' && (error as any).sentryId) ?? ''

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
        {isRemoveChildError || isInsertBeforeError ? (
          <Admonition
            type="warning"
            title="This error might be caused by Google translate or third-party browser extensions"
          >
            <p className="prose max-w-full text-sm !leading-normal">
              Try to avoid using Google translate or disable certain browser extensions to avoid
              running into the{' '}
              <code className="text-xs">
                {isRemoveChildError
                  ? `'removeChild' on 'Node'`
                  : isInsertBeforeError
                    ? `'insertBefore' on 'Node'`
                    : ''}
              </code>{' '}
              error.{' '}
              <span
                className={cn(InlineLinkClassName, 'cursor-pointer')}
                onClick={() => window.location.reload()}
              >
                Refresh
              </span>{' '}
              the browser to see if occurs again.
            </p>
            <Button asChild className="mt-2" type="default" icon={<ExternalLink />}>
              <a
                target="_blank"
                rel="noreferrer"
                href={
                  isRemoveChildError
                    ? 'https://github.com/facebook/react/issues/17256'
                    : isInsertBeforeError
                      ? 'https://github.com/facebook/react/issues/24865'
                      : '/'
                }
              >
                More information
              </a>
            </Button>
          </Admonition>
        ) : (
          <Admonition type="warning" showIcon={false} title="We recommend trying the following:">
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
          </Admonition>
        )}
        <div
          className={cn(
            'w-full mx-auto grid gap-2',
            !isRemoveChildError && !isInsertBeforeError
              ? 'grid-cols-2 sm:w-1/2'
              : 'grid-cols-1 sm:w-1/4'
          )}
        >
          {!isRemoveChildError && !isInsertBeforeError && (
            <Button asChild type="default" icon={<ExternalLink />}>
              <Link
                target="_blank"
                rel="noopenner noreferrer"
                href={`/support/new?category=dashboard_bug${sentryIssueId ? `&sid=${sentryIssueId}` : ''}&subject=Client%20side%20exception%20occurred%20on%20dashboard&message=${encodeURI(urlMessage)}`}
              >
                Contact support
              </Link>
            </Button>
          )}

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

          {(isRemoveChildError || isInsertBeforeError) && (
            <Link
              target="_blank"
              rel="noopenner noreferrer"
              className="text-center text-xs text-foreground-lighter hover:text-foreground-light transition"
              href={`/support/new?category=dashboard_bug${sentryIssueId ? `&sid=${sentryIssueId}` : ''}&subject=Client%20side%20exception%20occurred%20on%20dashboard&message=${encodeURI(urlMessage)}`}
            >
              Still stuck?
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
