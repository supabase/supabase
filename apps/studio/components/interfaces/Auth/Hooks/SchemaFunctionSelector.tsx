import { useState, useEffect } from 'react'

import SchemaSelector from 'components/ui/SchemaSelector'
import FunctionSelector from './FunctionSelector'

interface SchemaFunctionSelectorProps {
  id: string
  values: any
  setFieldValue: (field: string, value: any) => void
  descriptionText?: string
  disabled?: boolean
}

const SchemaFunctionSelector = ({
  id,
  values,
  descriptionText,
  setFieldValue,
  disabled = false,
}: SchemaFunctionSelectorProps) => {
  const [_proto, _x, _db, schema, func] = (values[id] || '').split('/')
  // select the public schema by default
  const [selectedSchema, setSelectedSchema] = useState(schema || 'public')
  const [selectedFunc, setSelectedFunc] = useState(func || '')

  useEffect(() => {
    if (schema) {
      setSelectedSchema(schema)
    }
  }, [schema])

  useEffect(() => {
    if (func) {
      setSelectedFunc(func)
    }
  }, [func])

  return (
    <div className="flex flex-col gap-2">
      <SchemaSelector
        size="tiny"
        showError={false}
        selectedSchemaName={selectedSchema}
        onSelectSchema={(name) => {
          setSelectedSchema(name)
          setSelectedFunc('')
          setFieldValue(id, '')
        }}
        disabled={!!disabled || !values}
      />
      <FunctionSelector
        size="tiny"
        schema={selectedSchema}
        selectedFunctionName={selectedFunc}
        onSelectFunction={(name) => {
          setSelectedFunc(name)
          setFieldValue(id, `pg-functions://postgres/${selectedSchema}/${name}`)
        }}
        disabled={!!disabled || !values}
      />
      {descriptionText && (
        <div className="mt-2 text-foreground-lighter leading-normal text-sm">{descriptionText}</div>
      )}
    </div>
  )
}

export default SchemaFunctionSelector
