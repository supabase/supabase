import { FC } from 'react'

interface Props {
  isNewRecord: boolean
  tableName?: string
}

const HeaderTitle: FC<Props> = ({ isNewRecord, tableName }) => {
  let header = `${isNewRecord ? 'Add new' : 'Update'} row ${isNewRecord ? 'to' : 'from'} `

  return (
    <>
      {header}
      {tableName && <span className="text-code">{tableName}</span>}
    </>
  )
}

export default HeaderTitle
