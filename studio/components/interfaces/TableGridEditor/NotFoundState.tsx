import InformationBox from 'components/ui/InformationBox'
import { FC } from 'react'
import { IconAlertCircle } from 'ui'

interface Props {
  id: string | number
}

const NotFoundState: FC<Props> = ({ id }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-[400px]">
        <InformationBox
          icon={<IconAlertCircle strokeWidth={2} />}
          title={`Unable to find your table with ID ${id}`}
        />
      </div>
    </div>
  )
}

export default NotFoundState
