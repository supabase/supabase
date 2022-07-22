import { IconAlertCircle } from '@supabase/ui'
import InformationBox from 'components/ui/InformationBox'

const NotOrganizationOwnerWarning = () => {
  return (
    <div className="mt-4">
      <InformationBox
        icon={<IconAlertCircle className="text-white" size="large" strokeWidth={1.5} />}
        defaultVisibility={true}
        hideCollapse
        title="You do not have permissions to create a project"
        description={
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              Contact your organization owner or adminstrator to create a new project.
            </p>
          </div>
        }
      />
    </div>
  )
}

export default NotOrganizationOwnerWarning
