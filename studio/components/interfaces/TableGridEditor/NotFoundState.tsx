import { FC } from 'react'

interface Props {
  id: string | number
}

const NotFoundState: FC<Props> = ({ id }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <p>Oops! Unable to find your table with the ID {id}</p>
    </div>
  )
}

export default NotFoundState
