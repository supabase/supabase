import { Terminal } from 'lucide-react'

import { useParams } from 'common'
import CommandRender from 'components/interfaces/Functions/CommandRender'
import { EmptyState } from 'components/ui/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from 'ui'

export const MigrationsEmptyState = () => {
  const { ref } = useParams()

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
    <EmptyState
      icon={Terminal}
      title="Run your first migration"
      description="Create and run your first migration using the Supabase CLI."
    >
      <Card>
        <CardHeader>
          <CardTitle>Terminal instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <CommandRender commands={commands} />
        </CardContent>
      </Card>
    </EmptyState>
  )
}
