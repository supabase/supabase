import { FC } from 'react'
import { Typography } from '@supabase/ui'

interface Props {
  isNewRecord: boolean
  tableName?: string
}

const HeaderTitle: FC<Props> = ({ isNewRecord, tableName }) => {
  let header = `${isNewRecord ? 'Add new' : 'Update'} row ${isNewRecord ? 'to' : 'from'} `

  return (
    <>
      {header}
      {tableName && <Typography.Text code>{tableName}</Typography.Text>}
    </>
  )
}

export default HeaderTitle
