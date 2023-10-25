import TableSelector from './TableSelector'

export const TableSchema = ({
  value,
  schema,
  onChange,
}: {
  value: string
  schema: string
  onChange: (v: string, id: number | undefined) => void
}) => {
  return (
    <div className="flex flex-row gap-4">
      <div className="w-[88px] flex justify-end">
        <span>AND</span>
      </div>

      <div className="flex flex-row">
        <TableSelector
          selectedSchemaName={schema}
          selectedTableName={value}
          onSelectTable={onChange}
          className="w-64"
        />
      </div>
    </div>
  )
}
