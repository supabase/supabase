import InformationBox from 'components/ui/InformationBox'
import { AlertCircle } from 'lucide-react'

interface NotOrganizationOwnerWarningProps {
  slug?: string
}

// [Joshen] This can just use NoPermission component i think
const NotOrganizationOwnerWarning = ({ slug }: NotOrganizationOwnerWarningProps) => {
  return (
    <div className="mt-4">
      <InformationBox
        icon={<AlertCircle size="20" strokeWidth={1.5} />}
        defaultVisibility={true}
        hideCollapse
        title="You do not have permission to create a project"
        description={
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              {slug ? (
                <>
                  Contact the owner or administrator to create a new project in the{' '}
                  <code>{slug}</code> organization.
                </>
              ) : (
                <>Contact the owner or administrator to create a new project.</>
              )}
            </p>
          </div>
        }
      />
    </div>
  )
}

export default NotOrganizationOwnerWarning
