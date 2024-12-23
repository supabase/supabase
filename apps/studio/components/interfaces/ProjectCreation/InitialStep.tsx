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
      <div className="relative text-center text-sm text-foreground-lighter my-4 before:absolute before:inset-y-1/2 before:left-0 before:w-[calc(50%-24px)] before:h-px before:bg-border after:absolute after:inset-y-1/2 after:right-0 after:w-[calc(50%-24px)] after:h-px after:bg-border">
        or
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div
          className="p-4 h-auto block border rounded-md cursor text-sm border-strong hover:border-foreground-muted cursor-pointer flex items-center gap-4"
          role="button"
          onClick={onStartBlank}
        >
          <Database strokeWidth={1.5} size={16} className="text-foreground-lighter shrink-0" />
          <div>
            <span className="block">Start blank</span>
            <span className="text-foreground-lighter">Configure a database and dive right in</span>
          </div>
        </div>
        <div
          className="p-4 h-auto block border rounded-md cursor text-sm border-strong hover:border-foreground-muted cursor-pointer flex items-center gap-4"
          role="button"
          onClick={onMigrate}
        >
          <Import
            strokeWidth={1.5}
            size={16}
            className="text-foreground-lighter mx-auto shrink-0"
          />
          <div>
            <span className="mb-1 block">Migrate</span>
            <span className="text-foreground-lighter">
              Import your database from another provider
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step1
