import { FC } from 'react'
import CardButton from 'components/ui/CardButton'

interface Props {}

const ShimmeringCard: FC<Props> = ({}) => {
  return (
    <CardButton title="" footer={<div className="shimmering-loader rounded py-3 mx-1 w-1/3" />}>
      <div className="flex flex-col justify-between space-y-2">
        <div className="shimmering-loader rounded py-3 mx-1 w-2/3" />
      </div>
    </CardButton>
  )
}

export default ShimmeringCard
