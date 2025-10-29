import { AlertCircle } from 'lucide-react'

import InformationBox from 'components/ui/InformationBox'
import Panel from 'components/ui/Panel'

interface DisabledWarningDueToIncidentProps {
  title: string
}

export const DisabledWarningDueToIncident = ({ title }: DisabledWarningDueToIncidentProps) => {
  return (
    <Panel.Content className="pb-8">
      <InformationBox
        icon={<AlertCircle size={20} strokeWidth={1.5} />}
        defaultVisibility={true}
        hideCollapse
        title={title}
        description={
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              Our engineers are currently working on a fix. You can follow updates on{' '}
              <a className="text-brand" href="https://status.supabase.com/">
                https://status.supabase.com/
              </a>
            </p>
          </div>
        }
      />
    </Panel.Content>
  )
}
