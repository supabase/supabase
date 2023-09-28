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
    <div className="px-6 py-4 bg-scale-400 border border-scale-600 rounded flex justify-between items-center">
      <div className="flex space-x-4">
        <IconAlertCircle strokeWidth={1.5} className="text-scale-1100" />
        <div className="space-y-1">
          <p className="text-sm text-scale-1200">{description}</p>
          <p className="text-sm text-scale-1000">
            Try refreshing your browser. However, if this issue persists, please reach out to us via
            support.
          </p>
        </div>
      </div>
      <Link href={`/support/new?ref=${projectRef}`}>
        <a target="_blank" rel="noreferrer">
          <Button>Contact support</Button>
        </a>
      </Link>
    </div>
  )
}

export default ClientLoadingError
