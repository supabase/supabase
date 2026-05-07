import type { OrgProject } from 'data/projects/org-projects-infinite-query'
import type { ReactNode } from 'react'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ProjectCommandItem } from './ProjectCommandItem'

export interface EmbeddedProjectListProps {
  projects: OrgProject[]
  selectedRef: string | undefined
  onSelect?: (project: OrgProject) => void
  onClose: () => void
  renderRow?: (project: OrgProject) => ReactNode
  checkPosition?: 'right' | 'left'
  isOptionDisabled?: (project: OrgProject) => boolean
  sentinelRef: (node: Element | null) => void
  hasNextPage: boolean
}

export function EmbeddedProjectList({
  projects,
  selectedRef,
  onSelect,
  onClose,
  renderRow,
  checkPosition,
  isOptionDisabled,
  sentinelRef,
  hasNextPage,
}: EmbeddedProjectListProps) {
  return (
    <div className="min-h-0 p-1">
      {projects.map((project) => (
        <ProjectCommandItem
          key={project.ref}
          project={project}
          selectedRef={selectedRef}
          onSelect={onSelect}
          onClose={onClose}
          renderRow={renderRow}
          checkPosition={checkPosition}
          isOptionDisabled={isOptionDisabled}
        />
      ))}
      <div ref={sentinelRef} className="h-1 -mt-1" />
      {hasNextPage && (
        <div className="px-2 py-1">
          <ShimmeringLoader className="py-2" />
        </div>
      )}
    </div>
  )
}
