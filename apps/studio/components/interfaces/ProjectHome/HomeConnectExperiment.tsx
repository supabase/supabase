import { useConsentState, useFeatureFlags } from 'common'
import { useEffect, useRef, useState } from 'react'

import { AgentPromptSection } from './AgentPromptSection'
import { ConnectSection } from './ConnectSection'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { useTrack } from '@/lib/telemetry/track'

const EXPERIMENT_ID = 'homeAgentPrompt'

type Assignment = { variant: 'control' | 'test' | undefined }

export const HomeConnectExperiment = () => {
  const flagValue = usePHFlag<string | false>(EXPERIMENT_ID)
  const { hasFlagsForSignedInUser } = useFeatureFlags()
  const { hasAccepted: hasAcceptedAnalytics } = useConsentState()
  const track = useTrack()

  // Held for the life of the mount: a later flag refetch must not swap the arm the user already saw.
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  if (assignment === null && hasFlagsForSignedInUser) {
    setAssignment({
      variant: flagValue === 'control' || flagValue === 'test' ? flagValue : undefined,
    })
  }

  const hasTrackedExposure = useRef(false)
  useEffect(() => {
    if (!assignment || !hasAcceptedAnalytics) return
    if (hasTrackedExposure.current) return
    hasTrackedExposure.current = true
    track(
      'home_connect_section_exposed',
      assignment.variant ? { experiment_id: EXPERIMENT_ID, variant: assignment.variant } : {}
    )
  }, [assignment, hasAcceptedAnalytics, track])

  if (!assignment) return null
  if (assignment.variant === 'test') return <AgentPromptSection />
  return <ConnectSection />
}
