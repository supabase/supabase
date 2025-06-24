import { OrganizationSelector } from 'components/ui/org-selector'
import { Organization } from 'types'
import { ProjectClaimLayout } from './layout'

export interface ProjectClaimChooseOrgProps {
  onChoose: (org: Organization) => void
}

const MAX_ORGS_TO_SHOW = 5

export function ProjectClaimChooseOrg({ onChoose }: ProjectClaimChooseOrgProps) {
  return (
    <ProjectClaimLayout title="Claim a project">
      <div className="mx-auto gap-y-4 py-6 flex flex-col">
        <p className="text-sm text-foreground-light">
          This is the first step in claiming your Supabase project. Once you're finished, the
          project will be transferred to Supabase organization.
        </p>
        <p className="text-sm text-foreground-light">Please select an organization to continue.</p>
        <OrganizationSelector onSelect={onChoose} maxOrgsToShow={MAX_ORGS_TO_SHOW} />
      </div>
    </ProjectClaimLayout>
  )
}
