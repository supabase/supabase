import TableSelector from './TableSelector'

export const FilterTable = ({
  value,
  schema,
  onChange,
}: {
  value: string
  schema: string
  onChange: (v: string, id: number | undefined) => void
}) => {
  return (
    <div className="flex flex-row gap-4 items-center">
      <p className="w-[60px] flex justify-end text-sm">AND</p>
      <TableSelector
        selectedSchemaName={schema}
        selectedTableName={value}
        onSelectTable={onChange}
        className="w-64"
        size="small"
      />
    </div>
  )
}
