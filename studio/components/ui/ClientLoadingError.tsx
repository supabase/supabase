import Link from 'next/link'
import { Button, IconAlertCircle } from 'ui'

export interface ClientLoadingErrorProps {
  projectRef: string
  description: string
}

const ClientLoadingError = ({
  projectRef,
  description = 'An error has occurred',
}: ClientLoadingErrorProps) => {
  return (
    <div className="px-6 py-4 bg-surface-200 border border-overlay rounded flex justify-between items-center">
      <div className="flex space-x-4">
        <IconAlertCircle strokeWidth={1.5} className="text-foreground-light" />
        <div className="space-y-1">
          <p className="text-sm text-foreground">{description}</p>
          <p className="text-sm text-foreground-light">
            Try refreshing your browser. However, if this issue persists, please reach out to us via
            support.
          </p>
        </div>
      </div>
      <Button asChild>
        <Link href={`/support/new?ref=${projectRef}`} target="_blank" rel="noreferrer">
          Contact support
        </Link>
      </Button>
    </div>
  )
}

export default ClientLoadingError
