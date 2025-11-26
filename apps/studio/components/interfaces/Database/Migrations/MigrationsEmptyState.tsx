import { Terminal } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import CommandRender from 'components/interfaces/Functions/CommandRender'
import { Card, CardContent, CardHeader, CardTitle } from 'ui'

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
      comment: 'Run all migrations for this project',
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
    <aside className="border border-dashed w-full bg-surface-100 rounded-lg px-4 py-10 flex flex-col gap-y-6 items-center">
      <div className="flex flex-col gap-y-3 items-center ">
        <Terminal size={24} strokeWidth={1.5} className="text-foreground-muted" />

        <div className="flex flex-col items-center text-center text-balance">
          <h3>Run your first migration</h3>
          <p className="text-foreground-light text-sm max-w-[720px]">
            Create and run your first migration using the Supabase CLI
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Terminal instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <CommandRender commands={commands} />
        </CardContent>
      </Card>
    </aside>
  )
}

export default MigrationsEmptyState
