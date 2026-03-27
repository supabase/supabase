'use client'

import { useProjectDetailQuery } from 'data/projects/project-detail-query'

import { useV2Params } from '@/app/v2/V2ParamsContext'

export function V2EditorFooter() {
  const { projectRef } = useV2Params()
  const { data: project } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  return (
    <footer className="flex items-center justify-between px-3 py-1 text-xs text-foreground-lighter border-t border-border bg-background shrink-0">
      <span className="font-mono truncate">{projectRef ?? '—'}</span>
      <span>Connections: —</span>
      <span>{project?.status === 'ACTIVE_HEALTHY' ? 'Healthy' : (project?.status ?? '—')}</span>
    </footer>
  )
}
