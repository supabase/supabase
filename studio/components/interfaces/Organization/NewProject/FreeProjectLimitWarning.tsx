import { FC } from 'react'
import { IconAlertCircle } from '@supabase/ui'
import InformationBox from 'components/ui/InformationBox'

interface Props {
  limit: number
}

const FreeProjectLimitWarning: FC<Props> = ({ limit }) => {
  return (
    <div className="mt-4">
      <InformationBox
        icon={<IconAlertCircle className="text-scale-1200" size="large" strokeWidth={1.5} />}
        defaultVisibility={true}
        hideCollapse
        title="Your account has reached its free project limit"
        description={
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              {`Your account can only have up to ${limit} free projects - to create another free project, you'll need to delete or pause an existing free project first. Otherwise, you may create a project on the Pro tier instead.`}
            </p>
          </div>
        }
      />
    </div>
  )
}

export default FreeProjectLimitWarning
