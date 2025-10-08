import InformationBox from 'components/ui/InformationBox'
import { AlertCircle } from 'lucide-react'

interface DisabledWarningDueToIncidentProps {
  title: string
}

const DisabledWarningDueToIncident = ({ title }: DisabledWarningDueToIncidentProps) => {
  return (
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
  )
}

export default DisabledWarningDueToIncident
