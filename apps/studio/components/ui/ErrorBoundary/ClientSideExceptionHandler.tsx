import { ExternalLink } from 'lucide-react'

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { useRouter } from 'next/router'
import { Button, cn } from 'ui'
import { Admonition } from 'ui-patterns'
import CopyButton from '../CopyButton'
import { InlineLinkClassName } from '../InlineLink'

interface ClientSideExceptionHandlerProps {
  message: string
  sentryIssueId: string
  urlMessage: string
  resetErrorBoundary: () => void
}

export const ClientSideExceptionHandler = ({
  message,
  sentryIssueId,
  urlMessage,
  resetErrorBoundary,
}: ClientSideExceptionHandlerProps) => {
  const router = useRouter()

  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod'

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
    <>
      <div className="flex flex-col gap-y-1 text-left py-2 w-full">
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-bold">Sorry! An unexpected error occurred.</p>
          <CopyButton type="outline" text={message} copyLabel="Copy error" />
        </div>
        <p className="text-sm">
          Application error: a client-side exception has occurred (see browser console for more
          information)
        </p>
        <p className="text-foreground-light text-sm">{message}</p>
      </div>
      <Admonition type="note" showIcon={false} title="We recommend trying the following:">
        <ul className="list-disc mt-1.5 pl-2 list-inside text-sm space-y-1">
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
          <li>Disable browser extensions that might modify page content (e.g. Google Translate)</li>
          <li>If the problem persists, please contact support for assistance</li>
        </ul>
      </Admonition>

      <div className={cn('w-full mx-auto grid gap-2', 'grid-cols-2 sm:w-1/2')}>
        <Button asChild type="default" icon={<ExternalLink />}>
          <SupportLink
            queryParams={{
              category: SupportCategories.DASHBOARD_BUG,
              subject: 'Client side exception occurred on dashboard',
              sid: sentryIssueId,
              error: urlMessage,
            }}
          >
            Contact support
          </SupportLink>
        </Button>

        {/* [Joshen] For local and staging, allow us to escape the error boundary */}
        {/* We could actually investigate how to make this available on prod, but without being able to reliably test this, I'm not keen to do it now */}
        {isProduction ? (
          <Button type="outline" onClick={() => router.reload()}>
            Reload dashboard
          </Button>
        ) : (
          <Button type="outline" onClick={() => resetErrorBoundary()}>
            Return to dashboard
          </Button>
        )}
      </div>
    </>
  )
}
