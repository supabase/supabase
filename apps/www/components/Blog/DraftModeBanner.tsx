import { AlertTriangle, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

interface DraftModeBannerProps {
  onDismiss?: () => void
}

function DraftModeBanner({ onDismiss }: DraftModeBannerProps) {
  return (
    <div className="fixed inset-0 top-auto z-40 bg-surface-400 border-t">
      <div className="max-w-2xl mx-auto py-2 px-4">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="ml-2 truncate">
              <span className="md:hidden">You're viewing draft content</span>
              <span className="hidden md:inline">
                You're viewing draft content that may not be published yet.
              </span>
            </p>
          </div>
          {onDismiss && (
            <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
              <button
                type="button"
                className="-mr-1 flex p-2 rounded-md sm:-mr-2"
                onClick={onDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DraftModeBanner
