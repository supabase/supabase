interface HeaderTitleProps {
  isNewRecord: boolean
  tableName?: string
}

export const HeaderTitle = ({ isNewRecord, tableName }: HeaderTitleProps) => {
  let header = `${isNewRecord ? 'Add new' : 'Update'} row ${isNewRecord ? 'to' : 'from'} `
  return (
    <span>
      {header}
      {tableName && <code className="text-code-inline !text-sm">{tableName}</code>}
    </span>
  )
}
