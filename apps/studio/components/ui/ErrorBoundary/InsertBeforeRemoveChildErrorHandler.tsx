import { SupportCategories } from '@supabase/shared-types/out/constants'
import { Blocks, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/router'

import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { detectBrowser } from 'lib/helpers'
import { Button } from 'ui'

interface InsertBeforeRemoveChildErrorHandlerProps {
  message: string
  sentryIssueId: string
  urlMessage: string
  isRemoveChildError: boolean
  isInsertBeforeError?: boolean
}

export const InsertBeforeRemoveChildErrorHandler = ({
  message,
  sentryIssueId,
  urlMessage,
  isRemoveChildError,
  isInsertBeforeError,
}: InsertBeforeRemoveChildErrorHandlerProps) => {
  const router = useRouter()
  const browser = detectBrowser()

  return (
    <>
      <div className="flex flex-col gap-y-4 text-left py-2 w-full">
        <div className="flex items-center gap-x-3">
          <p className="text-lg font-bold">Sorry! A browser extension may have caused an error.</p>
          <Blocks className="text-foreground-lighter" />
        </div>

        <div className="flex flex-col gap-y-2">
          <p className="text-sm text-foreground-light">
            Browser translation tools (like Chrome's built-in Translate) or some third-party browser
            extensions are known to cause errors when using the Supabase Dashboard.
          </p>

          <p className="text-sm text-foreground-light">
            We highly recommend{' '}
            <span className="text-foreground">
              {browser === 'Chrome'
                ? 'disabling Chrome Translate or certain browser extensions'
                : 'avoiding the use of browser translation tools or disabling certain extensions'}
            </span>{' '}
            while using the Supabase Dashboard to avoid running into this error. Try to refresh the
            browser to see if it occurs again.
          </p>
        </div>

        <p className="text-foreground-lighter text-sm">Error: {message}</p>
      </div>

      <div className="flex gap-x-2 justify-center items-center">
        <Button asChild type="default" icon={<ExternalLink />}>
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
        <Button type="outline" onClick={() => router.reload()}>
          Refresh page
        </Button>
      </div>
      <SupportLink
        className="text-center text-xs text-foreground-lighter hover:text-foreground-light transition"
        queryParams={{
          category: SupportCategories.DASHBOARD_BUG,
          subject: `Client error: Failed to execute '${isRemoveChildError ? 'removeChild' : 'insertBefore'}' on 'Node'`,
          sid: sentryIssueId,
          error: urlMessage,
        }}
      >
        Still stuck?
      </SupportLink>
    </>
  )
}
