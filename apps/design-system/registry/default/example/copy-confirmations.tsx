'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from 'ui'

export default function CopyConfirmations() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 w-[400px]">
        <span className="text-xs text-foreground-muted">Bad Example</span>
        <div className="flex flex-col gap-5 border border-border rounded-md p-4 bg-surface-100">
          <div className="flex flex-row items-start gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <h3 className="text-sm font-medium text-foreground">Are you sure?</h3>
              <p className="text-sm text-foreground-light">
                All data will be removed if this project is deleted
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="default" size="tiny">
              Cancel
            </Button>
            <Button type="danger" size="tiny">
              Delete
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 w-[400px]">
        <span className="text-xs text-foreground-muted">Good Example</span>
        <div className="flex flex-col gap-5 border border-border rounded-md p-4 bg-surface-100">
          <div className="flex flex-row items-start gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <h3 className="text-sm font-medium text-foreground">Delete this project?</h3>
              <p className="text-sm text-foreground-light">
                This action cannot be undone and will permanently delete all data. Deleting this
                project will remove all data.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="default" size="tiny">
              Cancel
            </Button>
            <Button type="danger" size="tiny">
              Delete project
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
