import { IconAlertCircle } from 'ui'

import InformationBox from 'components/ui/InformationBox'

interface NotFoundStateProps {
  id: string | number
}

const NotFoundState = ({ id }: NotFoundStateProps) => {
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
