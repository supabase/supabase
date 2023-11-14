import clsx from 'clsx'
import { useState } from 'react'
import { Collapsible, IconMaximize2, IconMinimize2, IconTerminal } from 'ui'

import { useParams } from 'common'
import CommandRender from 'components/interfaces/Functions/CommandRender'

const MigrationsEmptyState = () => {
  const { ref } = useParams()
  const [showInstructions, setShowInstructions] = useState(false)

  const commands = [
    {
      comment: 'Link your project',
      command: `supabase link --project-ref ${ref}`,
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">supabase</span> link --project-ref {ref}
          </>
        )
      },
    },
    {
      comment: 'Create a new migration called "new-migration"',
      command: `supabase migration new new-migration`,
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">supabase</span> migration new new-migration
          </>
        )
      },
    },
    {
      comment: 'Run all migrations against this project',
      command: `supabase db push`,
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">supabase</span> db push
          </>
        )
      },
    },
  ]

  return (
    <div className="w-full px-12 py-12 bg-no-repeat border rounded bg-background border-default">
      <div className="space-y-8">
        <div className="space-y-2 w-4/5">
          <h4 className="text-lg">Database migrations</h4>
          <p className="text-sm text-foreground-light">
            Database changes are managed through "migrations" and they are a common way of tracking
            changes to your database over time. You can run migrations against your project's
            database via the Supabase CLI.
          </p>
        </div>

        <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
          <Collapsible.Trigger asChild>
            <button
              type="button"
              className={clsx(
                'flex w-full items-center justify-between rounded py-3 px-6 text-foreground border bg-surface-100',
                showInstructions && 'rounded-b-none'
              )}
            >
              <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 p-2 border rounded bg-alternative">
                    <IconTerminal strokeWidth={2} />
                  </div>
                  <h4>Terminal instructions</h4>
                </div>
                {showInstructions ? (
                  <IconMinimize2
                    className="text-border-stronger transition data-open-parent:rotate-0 data-closed-parent:rotate-180"
                    strokeWidth={2}
                    width={14}
                  />
                ) : (
                  <IconMaximize2
                    className="text-border-stronger transition data-open-parent:rotate-0 data-closed-parent:rotate-180"
                    strokeWidth={2}
                    width={14}
                  />
                )}
              </div>
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="border border-t-0 bg-surface-100 rounded-b py-3 px-6">
              <CommandRender commands={commands} />
            </div>
          </Collapsible.Content>
        </Collapsible>
      </div>
    </div>
  )
}

export default MigrationsEmptyState
