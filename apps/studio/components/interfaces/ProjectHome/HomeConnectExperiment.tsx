import { useFeatureFlags } from 'common'
import { useEffect, useRef } from 'react'

import { AgentPromptSection } from './AgentPromptSection'
import { ConnectSection } from './ConnectSection'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { useTrack } from '@/lib/telemetry/track'

const EXPERIMENT_ID = 'homeAgentPrompt'

export const HomeConnectExperiment = () => {
  const flagValue = usePHFlag<string | false>(EXPERIMENT_ID)
  const { hasFlagsForSignedInUser } = useFeatureFlags()
  const track = useTrack()

  const assignedVariant = flagValue === 'control' || flagValue === 'test' ? flagValue : undefined

  const hasTrackedExposure = useRef(false)
  useEffect(() => {
    if (!hasFlagsForSignedInUser) return
    if (hasTrackedExposure.current) return
    hasTrackedExposure.current = true
    track(
      'home_connect_section_exposed',
      assignedVariant ? { experiment_id: EXPERIMENT_ID, variant: assignedVariant } : {}
    )
  }, [hasFlagsForSignedInUser, assignedVariant, track])

  if (!hasFlagsForSignedInUser) return null
  if (assignedVariant === 'test') return <AgentPromptSection />
  return <ConnectSection />
}
