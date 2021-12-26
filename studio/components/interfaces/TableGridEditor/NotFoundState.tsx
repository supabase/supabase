import { Typography } from '@supabase/ui'
import { FC } from 'react'

interface Props {
  id: string | number
}

const NotFoundState: FC<Props> = ({ id }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <Typography.Text>Oops! Unable to find your table with the ID {id}</Typography.Text>
    </div>
  )
}

export default NotFoundState
