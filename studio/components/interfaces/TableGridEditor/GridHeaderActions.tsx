import { FC } from 'react'
import Link from 'next/link'
import { Button, IconAlertCircle, IconLock } from '@supabase/ui'
import { PostgresTable } from '@supabase/postgres-meta'
import { useStore } from 'hooks'

interface Props {
  table: PostgresTable
}

const GridHeaderActions: FC<Props> = ({ table }) => {
  // Will need to import from a constants json of sorts
  const { ui } = useStore()
  const projectRef = ui.selectedProject?.ref
  const urlToRLSPolicies = `/project/${projectRef}/auth/policies`

  return (
    <div className="space-x-3 flex items-center">
      <Link href={urlToRLSPolicies}>
        <Button
          type={table.rls_enabled ? 'link' : 'warning'}
          icon={
            table.rls_enabled ? (
              <IconLock strokeWidth={2} size={14} />
            ) : (
              <IconAlertCircle strokeWidth={2} size={14} />
            )
          }
        >
          RLS {table.rls_enabled ? 'is' : 'not'} enabled
        </Button>
      </Link>
    </div>
  )
}

export default GridHeaderActions
