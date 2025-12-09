import { AlertCircle } from 'lucide-react'
import { cn } from 'ui'

interface NoPermissionProps {
  resourceText: string
  isFullPage?: boolean
}

export const NoPermission = ({ resourceText, isFullPage = false }: NoPermissionProps) => {
  const NoPermissionMessage = () => (
    <div
      className={cn(
        'block w-full rounded border border-opacity-20 py-4 px-6',
        'border bg-surface-200'
      )}
    >
      <div className="flex space-x-3">
        <div className="mt-1">
          <AlertCircle size={20} />
        </div>
        <div className="flex w-full items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm">You need additional permissions to {resourceText}</p>
            <div>
              <p className="text-sm text-foreground-light">
                Contact your organization owner or administrator for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (isFullPage) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-[550px]">
          <NoPermissionMessage />
        </div>
      </div>
    )
  } else {
    return <NoPermissionMessage />
  }
}

export default NoPermission
