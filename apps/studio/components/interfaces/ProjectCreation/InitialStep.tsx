import { useState } from 'react'
import { Button, Textarea } from 'ui'
import { Database, Import } from 'lucide-react'

const Step1 = ({
  onSubmit,
  onStartBlank,
  onMigrate,
}: {
  onSubmit: (value: string) => void
  onStartBlank: () => void
  onMigrate: () => void
}) => {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(value)
  }

  return (
    <div className="flex w-full h-screen overflow-auto bg-background-200">
      <div className="max-w-[600px] mx-auto p-16 min-h-screen flex items-center">
        <div className="w-full">
          <h3>What are you building?</h3>
          <p className="text-sm text-foreground-lighter mb-4">
            We can generate a starting schema for you including sample data.
          </p>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mb-4 bg-surface-100 w-full"
            placeholder="e.g. a messaging app with users, messages and groups built on NextJS"
          />
          <Button onClick={handleSubmit} type="primary" className="w-full">
            Continue
          </Button>
          <div className="text-center text-sm text-foreground-lighter my-4">or</div>
          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-6 h-auto block text-center border rounded-md cursor text-sm border-strong hover:border-foreground-muted cursor-pointer"
              role="button"
              onClick={onStartBlank}
            >
              <Database
                strokeWidth={1.5}
                size={20}
                className="text-foreground-lighter mx-auto mb-4"
              />
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
              <Import
                strokeWidth={1.5}
                size={20}
                className="text-foreground-lighter mx-auto mb-4"
              />
              <span className="mb-1 block">Migrate</span>
              <span className="text-foreground-lighter text-center">
                Import your database from another provider
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step1
