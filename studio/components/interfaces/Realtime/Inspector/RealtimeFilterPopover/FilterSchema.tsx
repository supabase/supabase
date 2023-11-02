import SchemaSelector from 'components/ui/SchemaSelector'

export const FilterSchema = ({
  value,
  onChange,
}: {
  value: string
  onChange: (s: string) => void
}) => {
  return (
    <div className="flex flex-row gap-4">
      <p className="w-[60px] flex justify-end text-sm">WHERE</p>

      <div className="flex flex-row">
        <SchemaSelector
          selectedSchemaName={value}
          onSelectSchema={onChange}
          className="rounded-l-none [&>button>span>div]:py-0 w-64"
        />
      </div>
    </div>
  )
}
