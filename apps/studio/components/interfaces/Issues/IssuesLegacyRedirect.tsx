import { useParams } from 'common'
import { parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useRef } from 'react'

import { getLegacyIssueDestination } from './IssuesLegacyRedirect.utils'
import { useProjectIssues } from '@/data/issues/useProjectIssues'
import { BASE_PATH } from '@/lib/constants'

export const replaceIssuesLocation = (destination: string) => window.location.replace(destination)

export const IssuesLegacyRedirect = ({
  onRedirect = replaceIssuesLocation,
}: {
  onRedirect?: (destination: string) => void
}) => {
  const [{ id, preset }] = useQueryStates({ id: parseAsString, preset: parseAsString })
  if (id === null && preset === null) return null
  return <LegacyFindingRedirect onRedirect={onRedirect} />
}

const LegacyFindingRedirect = ({ onRedirect }: { onRedirect: (destination: string) => void }) => {
  const { ref } = useParams()
  const redirectedDestination = useRef<string | null>(null)
  const { issues, isLoading, isHealthLoading, isError, isSuccess } = useProjectIssues({
    projectRef: ref,
  })

  useEffect(() => {
    if (!ref || isLoading || isHealthLoading || isError || !isSuccess) return
    const destination = getLegacyIssueDestination(
      new URL(window.location.href),
      issues,
      `${BASE_PATH}/project/${encodeURIComponent(ref)}/issues`
    )
    if (destination && redirectedDestination.current !== destination) {
      redirectedDestination.current = destination
      onRedirect(destination)
    }
  }, [ref, issues, isLoading, isHealthLoading, isError, isSuccess, onRedirect])

  return null
}
