import { isError } from 'lodash'
import Link from 'next/link'

import { ClientSideExceptionHandler } from './ClientSideExceptionHandler'
import { InsertBeforeRemoveChildErrorHandler } from './InsertBeforeRemoveChildErrorHandler'
import { useChunkLoadReload } from './useChunkLoadReload'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useRoutePattern } from '@/hooks/misc/useRoutePattern'
import { BASE_PATH } from '@/lib/constants'

export type FallbackProps = {
  error: unknown
  resetErrorBoundary: (...args: unknown[]) => void
}

export const GlobalErrorBoundaryState = ({ error, resetErrorBoundary }: FallbackProps) => {
  const routePattern = useRoutePattern()
  const checkIsError = isError(error)

  const largeLogo = useIsFeatureEnabled('branding:large_logo')

  // Render nothing rather than flash the error state while the reload is in
  // flight. The boundary's `onError` reloads on the first catch; the hook also
  // covers a later re-render that becomes eligible after `onError` already ran
  const { isReloading } = useChunkLoadReload(error)
  if (isReloading) return null

  const errorMessage = checkIsError ? error.message : ''
  const urlMessage = checkIsError ? `Path name: ${routePattern}\n\n${error?.stack}` : ''

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
            src={`${BASE_PATH}/img/supabase-logo.svg`}
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
