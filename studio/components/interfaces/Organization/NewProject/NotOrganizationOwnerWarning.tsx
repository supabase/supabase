import { IconAlertCircle } from '@supabase/ui'

import { useFlag } from 'hooks'
import InformationBox from 'components/ui/InformationBox'

// [Joshen] This can just use NoPermission component i think
const NotOrganizationOwnerWarning = () => {
  const enablePermissions = useFlag('enablePermissions')

  return (
    <div className="mt-4">
      <InformationBox
        icon={<IconAlertCircle className="text-white" size="large" strokeWidth={1.5} />}
        defaultVisibility={true}
        hideCollapse
        title="You do not have permission to create a project"
        description={
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              {enablePermissions
                ? 'Contact your organization owner or adminstrator to create a new project.'
                : 'Only the organization owner can create new projects. Contact your organization owner to create a new project for this organization.'}
            </p>
          </div>
        }
      />
    </div>
  )
}

export default NotOrganizationOwnerWarning
