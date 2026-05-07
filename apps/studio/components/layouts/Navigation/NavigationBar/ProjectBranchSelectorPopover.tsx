import { BranchDropdown } from 'components/layouts/AppLayout/BranchDropdown'
import { OrganizationDropdown } from 'components/layouts/AppLayout/OrganizationDropdown'
import { ProjectDropdown } from 'components/layouts/AppLayout/ProjectDropdown'

const embeddedClassName = 'bg-transparent border-0 shadow-none min-h-0 flex-1'

export interface ProjectBranchSelectorPopoverProps {
  onClose: () => void
}

export function ProjectBranchSelectorPopover({ onClose }: ProjectBranchSelectorPopoverProps) {
  return (
    <div className="flex divide-x h-[320px]">
      <OrganizationDropdown embedded className={embeddedClassName} onClose={onClose} />
      <ProjectDropdown embedded className={embeddedClassName} onClose={onClose} />
      <BranchDropdown embedded className={embeddedClassName} onClose={onClose} />
    </div>
  )
}
