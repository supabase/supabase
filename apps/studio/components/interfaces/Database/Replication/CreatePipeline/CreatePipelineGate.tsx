import { ArrowLeft } from 'lucide-react'
import { type ReactNode } from 'react'
import { Button } from 'ui'

export const CreatePipelineGate = ({
  title,
  description,
  onCancel,
  children,
}: {
  title: string
  description: string
  onCancel: () => void
  children: ReactNode
}) => {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-col gap-4 border-b px-6 py-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <button
            type="button"
            tabIndex={0}
            className="mb-2 flex items-center gap-1.5 text-sm text-foreground-light hover:text-foreground"
            onClick={onCancel}
          >
            <ArrowLeft size={14} />
            Replication
          </button>
          <h1 className="text-xl text-foreground">{title}</h1>
          <p className="max-w-xl text-sm text-foreground-light">{description}</p>
        </div>
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
      </header>
      <div className="mx-auto w-full max-w-[760px] px-6 py-8">{children}</div>
    </div>
  )
}
