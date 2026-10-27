import { isError } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { ClientSideExceptionHandler } from './ClientSideExceptionHandler'
import { InsertBeforeRemoveChildErrorHandler } from './InsertBeforeRemoveChildErrorHandler'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { getChunkLoadReloadDecision } from '@/lib/chunk-load-error'

export type FallbackProps = {
  error: unknown
  resetErrorBoundary: (...args: unknown[]) => void
}

export const GlobalErrorBoundaryState = ({ error, resetErrorBoundary }: FallbackProps) => {
  const router = useRouter()
  const checkIsError = isError(error)

  const largeLogo = useIsFeatureEnabled('branding:large_logo')

  // The boundary's `onError` reloads the page; render nothing rather than
  // flash the error state while the reload is in flight
  if (getChunkLoadReloadDecision(error)) return null

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

  return (
    <div className="w-screen mx-auto h-screen flex items-center justify-center">
      <header className="h-12 absolute top-0 w-full border-b px-4 flex items-center">
        <Link href="/" className="items-center justify-center">
          <img
            alt="Supabase"
            src={`${router.basePath}/img/supabase-logo.svg`}
            className={largeLogo ? 'h-[20px]' : 'h-[18px]'}
          />
        </Link>
      </header>

      <div className="flex flex-col gap-y-4 max-w-full sm:max-w-[660px] px-4 sm:px-0">
        {isRemoveChildError || isInsertBeforeError ? (
          <InsertBeforeRemoveChildErrorHandler
            message={errorMessage}
            sentryIssueId={sentryIssueId}
            urlMessage={urlMessage}
            isRemoveChildError={isRemoveChildError}
            isInsertBeforeError={isInsertBeforeError}
          />
        ) : (
          <ClientSideExceptionHandler
            message={errorMessage}
            sentryIssueId={sentryIssueId}
            urlMessage={urlMessage}
            resetErrorBoundary={resetErrorBoundary}
          />
        )}
      </div>
    </div>
  )
}
