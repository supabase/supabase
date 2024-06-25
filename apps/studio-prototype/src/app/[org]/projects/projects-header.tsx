'use client'

import { useConfig } from '@/src/hooks/use-config'
import { Badge } from 'ui'

export default function ProjectsHeader() {
  const [config] = useConfig()
  const { selectedOrg, selectedProject, selectedEnv, settingsAllPreviews } = config

  return (
    <div className="mb-4 flex items-center gap-2">
      <h1 className="text-3xl text-foreground">{selectedOrg?.name}</h1>
      <Badge>Free</Badge>
    </div>
  )
}
