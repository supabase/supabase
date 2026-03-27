'use client'

import { InstanceConfiguration } from 'components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration'

import { useV2Params } from '@/app/v2/V2ParamsContext'

export function HomeViewInfrastructureDiagram() {
  const { projectRef } = useV2Params()

  return <InstanceConfiguration diagramOnly projectRef={projectRef} />
}
