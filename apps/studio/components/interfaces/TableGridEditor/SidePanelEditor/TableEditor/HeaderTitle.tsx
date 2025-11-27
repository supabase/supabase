interface HeaderTitleProps {
  schema: string
  table?: { name: string }
  isDuplicating: boolean
}

const HeaderTitle = ({ schema, table, isDuplicating }: HeaderTitleProps) => {
  if (!table) {
    return (
      <>
        Create a new table under <code className="text-code-inline !text-sm">{schema}</code>
      </>
    )
  }
  if (isDuplicating) {
    return (
      <>
        Duplicate table <code className="text-code-inline !text-sm">{table?.name}</code>
      </>
    )
  }
  return (
    <>
      Update table <code className="text-code-inline !text-sm">{table?.name}</code>
    </>
  )
}

export default HeaderTitle
