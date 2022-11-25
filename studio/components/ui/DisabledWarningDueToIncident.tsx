import { FC } from 'react'
import { IconAlertCircle } from 'ui'
import InformationBox from 'components/ui/InformationBox'

interface Props {
  title: string
}

const DisabledWarningDueToIncident: FC<Props> = ({ title }) => {
  return (
    <InformationBox
      icon={<IconAlertCircle size={20} strokeWidth={1.5} />}
      defaultVisibility={true}
      hideCollapse
      title={title}
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
  )
}

export default DisabledWarningDueToIncident
