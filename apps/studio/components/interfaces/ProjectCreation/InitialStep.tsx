import { useState } from 'react'
import { Button, Textarea } from 'ui'
import { Database, Import } from 'lucide-react'
import { SchemaGenerator } from './SchemaGenerator'

const Step1 = ({
  onSubmit,
  onStartBlank,
  onMigrate,
  onSqlGenerated,
  onServicesUpdated,
  onTitleUpdated,
  isLoading,
}: {
  onSubmit: (value: string) => void
  onStartBlank: () => void
  onMigrate: () => void
  onSqlGenerated: (sql: string) => void
  onServicesUpdated: (services: string[]) => void
  onTitleUpdated: (title: string) => void
  isLoading: boolean
}) => {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(value)
  }

  return (
    <div className="w-full">
      <h3>What are you building?</h3>
      <p className="text-sm text-foreground-lighter mb-4">
        We can generate a starting schema for you including sample data.
      </p>
      <SchemaGenerator
        onSqlGenerated={(sql) => {
          onSqlGenerated(sql)
          onSubmit(sql)
        }}
        onServicesUpdated={onServicesUpdated}
        onTitleUpdated={onTitleUpdated}
        isOneOff={true}
      />
      <div className="text-center text-sm text-foreground-lighter my-4">or</div>
      <div className="grid grid-cols-2 gap-4">
        <div
          className="p-6 h-auto block text-center border rounded-md cursor text-sm border-strong hover:border-foreground-muted cursor-pointer"
          role="button"
          onClick={onStartBlank}
        >
          <Database strokeWidth={1.5} size={20} className="text-foreground-lighter mx-auto mb-4" />
          <span className="mb-1 block">Start blank</span>
          <span className="text-foreground-lighter text-center">
            Configure a database and dive right in
          </span>
        </div>
        <div
          className="p-6 h-auto block text-center border rounded-md cursor text-sm border-strong hover:border-foreground-muted cursor-pointer"
          role="button"
          onClick={onMigrate}
        >
          <Import strokeWidth={1.5} size={20} className="text-foreground-lighter mx-auto mb-4" />
          <span className="mb-1 block">Migrate</span>
          <span className="text-foreground-lighter text-center">
            Import your database from another provider
          </span>
        </div>
      </div>
    </div>
  )
}

export default Step1
