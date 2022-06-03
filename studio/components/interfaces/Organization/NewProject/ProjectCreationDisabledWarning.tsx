import { IconAlertCircle } from '@supabase/ui'
import InformationBox from 'components/ui/InformationBox'

const ProjectCreationDisabledWarning = () => {
  return (
    <div className="mt-4">
      <InformationBox
        icon={<IconAlertCircle className="text-white" size="large" strokeWidth={1.5} />}
        defaultVisibility={true}
        hideCollapse
        title="Project creation is currently disabled"
        description={
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              Our engineers are currently working on a fix. You can follow updates on{' '}
              <a className="text-brand-900" href="https://status.supabase.com/">
                https://status.supabase.com/
              </a>
            </p>
          </div>
        }
      />
    </div>
  )
}

export default ProjectCreationDisabledWarning
