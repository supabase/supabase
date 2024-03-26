interface HeaderTitleProps {
  isNewRecord: boolean
  tableName?: string
}

const HeaderTitle = ({ isNewRecord, tableName }: HeaderTitleProps) => {
  let header = `${isNewRecord ? 'Add new' : 'Update'} row ${isNewRecord ? 'to' : 'from'} `

  return (
    <>
      {header}
      {tableName && <span className="text-code font-mono">{tableName}</span>}
    </>
  )
}

export default HeaderTitle
