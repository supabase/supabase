'use client'

import ComputeAndDiskPage from '@/pages/project/[ref]/settings/compute-and-disk'
import { StudioDataWorkspace } from '@/components/v2/data/StudioDataWorkspace'
import { useV2Params } from '@/app/v2/V2ParamsContext'

export function V2ComputeSettingsView() {
  const { projectRef } = useV2Params()

  return (
    <StudioDataWorkspace projectRef={projectRef}>
      <ComputeAndDiskPage dehydratedState={undefined} />
    </StudioDataWorkspace>
  )
}
