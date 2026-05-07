import type { OrgProject } from 'data/projects/org-projects-infinite-query'
import { Check } from 'lucide-react'
import { ReactNode } from 'react'
import { cn, CommandItem_Shadcn_ } from 'ui'

export interface ProjectCommandItemProps {
  project: OrgProject
  selectedRef: string | undefined
  onSelect?: (project: OrgProject) => void
  onClose: () => void
  renderRow?: (project: OrgProject) => ReactNode
  checkPosition?: 'right' | 'left'
  isOptionDisabled?: (project: OrgProject) => boolean
}

export function ProjectCommandItem({
  project,
  selectedRef,
  onSelect,
  onClose,
  renderRow,
  checkPosition = 'right',
  isOptionDisabled,
}: ProjectCommandItemProps) {
  const handleSelect = () => {
    onSelect?.(project)
    onClose()
  }

  const disabled = isOptionDisabled?.(project) ?? false

  return (
    <CommandItem_Shadcn_
      key={project.ref}
      value={`${project.name.replaceAll('"', '')}-${project.ref}`}
      className="cursor-pointer w-full"
      onSelect={handleSelect}
      disabled={disabled}
    >
      {renderRow ? (
        renderRow(project)
      ) : (
        <div
          className={cn(
            'w-full flex items-center',
            checkPosition === 'left' ? 'gap-x-2' : 'justify-between',
            project.ref !== selectedRef && checkPosition === 'left' && 'ml-6'
          )}
        >
          {checkPosition === 'left' && project.ref === selectedRef && <Check size={16} />}
          {project.name}
          {checkPosition === 'right' && project.ref === selectedRef && <Check size={16} />}
        </div>
      )}
    </CommandItem_Shadcn_>
  )
}
