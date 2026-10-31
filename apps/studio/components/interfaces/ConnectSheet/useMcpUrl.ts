import { useParams } from 'common'
import { useMemo } from 'react'
import {
  FEATURE_GROUPS_NON_PLATFORM,
  FEATURE_GROUPS_PLATFORM,
  getMcpUrl,
} from 'ui-patterns/McpUrlBuilder'

import { StepContentProps } from './Connect.types'
import { IS_PLATFORM } from '@/lib/constants'

export function useMcpUrl(
  state: StepContentProps['state'],
  projectKeys: StepContentProps['projectKeys']
): string {
  const { ref: projectRef } = useParams()
  const readonly = Boolean(state.mcpReadonly)

  return useMemo(() => {
    const selectedFeatures = Array.isArray(state.mcpFeatures) ? state.mcpFeatures : []
    const supportedFeatures = IS_PLATFORM ? FEATURE_GROUPS_PLATFORM : FEATURE_GROUPS_NON_PLATFORM
    const validFeatures = selectedFeatures.filter((f) =>
      supportedFeatures.some((group) => group.id === f)
    )

    return getMcpUrl({
      projectRef,
      isPlatform: IS_PLATFORM,
      apiUrl: projectKeys.apiUrl ?? undefined,
      readonly,
      features: validFeatures,
    }).mcpUrl
  }, [projectKeys.apiUrl, projectRef, readonly, state.mcpFeatures])
}
