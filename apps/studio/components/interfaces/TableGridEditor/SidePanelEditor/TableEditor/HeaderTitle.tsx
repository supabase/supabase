interface HeaderTitleProps {
  schema: string
  table?: { name: string }
  isDuplicating: boolean
}

export const HeaderTitle = ({ schema, table, isDuplicating }: HeaderTitleProps) => {
  if (!table) {
    return (
      <span>
        Create a new table under <code className="text-code-inline text-sm!">{schema}</code>
      </span>
    )
  }
  if (isDuplicating) {
    return (
      <span>
        Duplicate table <code className="text-code-inline text-sm!">{table?.name}</code>
      </span>
    )
  }
  return (
    <span>
      Update table <code className="text-code-inline text-sm!">{table?.name}</code>
    </span>
  )
}
