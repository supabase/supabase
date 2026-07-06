import { noop } from 'lodash'
import { ChevronLeft, X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from 'ui'

import { POLICY_MODAL_VIEWS } from './PolicyEditorModal/PolicyEditorModal.constants'
import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'

export const StoragePolicyEditorModalTitle = ({
  view,
  bucketName,
  onSelectBackFromTemplates = noop,
}: {
  view: string
  bucketName: string
  onSelectBackFromTemplates: () => void
}) => {
  const getTitle = () => {
    if (view === POLICY_MODAL_VIEWS.EDITOR || view === POLICY_MODAL_VIEWS.SELECTION) {
      return `Adding new policy to ${bucketName}`
    }
    if (view === POLICY_MODAL_VIEWS.REVIEW) {
      return `Reviewing policies to be created for ${bucketName}`
    }
  }
  if (view === POLICY_MODAL_VIEWS.TEMPLATES) {
    return (
      <div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onSelectBackFromTemplates}
            className={cn(
              'cursor-pointer rounded-xs opacity-20 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-foreground-muted',
              'hit-area-6'
            )}
          >
            <ChevronLeft strokeWidth={2} size={14} />
            <span className="sr-only">Back</span>
          </button>
          <span>Select a template to use for your new policy</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-x-2 pr-6">
      <span className="truncate">{getTitle()}</span>
      <DocsButton href={`${DOCS_URL}/learn/auth-deep-dive/auth-policies`} />
      <DialogPrimitive.Close
        className={cn(
          'absolute p-0.5 right-3.5 top-4.5 rounded-xs opacity-20 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-foreground-muted',
          'hit-area-6'
        )}
      >
        <X size={16} />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </div>
  )
}
