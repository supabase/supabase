import { useFlag } from 'common'
import { useEffect } from 'react'

import { getFunctionLogsMigrationUrl } from './FunctionLogsNavigation.utils'

export function useFunctionLogsMigration({
  asPath,
  onReplace,
  projectRef,
  functionSlug,
  isEnabled,
  isLoading,
  isInvocationsPage = false,
}: {
  asPath: string
  onReplace: (url: string) => void
  projectRef?: string
  functionSlug?: string
  isEnabled: boolean
  isLoading: boolean
  isInvocationsPage?: boolean
}) {
  const usesOtelLegacyLogs = useFlag('otelLegacyLogs') === true
  const search = asPath.split('?')[1]?.split('#')[0] ?? ''
  const searchParams = new URLSearchParams(search)
  const hasLegacyParams = ['its', 'ite', 'log', 's', 'f'].some((key) => searchParams.has(key))
  const shouldMigrate = isEnabled && !isLoading && (isInvocationsPage || hasLegacyParams)
  const destination =
    shouldMigrate && projectRef && functionSlug
      ? getFunctionLogsMigrationUrl({ projectRef, functionSlug, searchParams, usesOtelLegacyLogs })
      : null

  useEffect(() => {
    if (destination) onReplace(destination)
  }, [destination, onReplace])

  return { isMigrating: destination !== null, shouldUseLegacyLogs: shouldMigrate && !destination }
}
