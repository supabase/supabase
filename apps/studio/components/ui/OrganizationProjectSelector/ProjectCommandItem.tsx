import { Check } from 'lucide-react'
import { ReactNode } from 'react'
import { cn, CommandItem } from 'ui'

import { CommandItemLink } from '@/components/ui/CommandItemLink'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'

export interface ProjectCommandItemProps {
  project: OrgProject
  selectedRef: string | undefined
  onSelect?: (project: OrgProject) => void
  onClose: () => void
  href?: string
  renderRow?: (project: OrgProject) => ReactNode
  checkPosition?: 'right' | 'left'
  isOptionDisabled?: (project: OrgProject) => boolean
}

export function ProjectCommandItem({
  project,
  selectedRef,
  onSelect,
  onClose,
  href,
  renderRow,
  checkPosition = 'right',
  isOptionDisabled,
}: ProjectCommandItemProps) {
  const handleSelect = () => {
    onSelect?.(project)
    onClose()
  }

  const disabled = isOptionDisabled?.(project) ?? false

  const content = (
    <>
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
    </>
  )

  const commandItemProps = {
    value: `${project.name.replaceAll('"', '')}-${project.ref}`,
    className: 'cursor-pointer w-full',
    onSelect: handleSelect,
    disabled,
  }

  return href ? (
    <CommandItemLink href={href} {...commandItemProps}>
      {content}
    </CommandItemLink>
  ) : (
    <CommandItem {...commandItemProps}>{content}</CommandItem>
  )
}
