import { FC } from 'react'
import Link from 'next/link'
import { Button, IconAlertCircle, IconLock } from 'ui'
import type { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'

import { useStore } from 'hooks'

interface Props {
  table: PostgresTable
}

const GridHeaderActions: FC<Props> = ({ table }) => {
  const { ui, meta } = useStore()
  const projectRef = ui.selectedProject?.ref
  const policies = meta.policies.list((policy: PostgresPolicy) => policy.table_id === table.id)

  return (
    <div className="flex items-center space-x-3">
      <Link href={`/project/${projectRef}/auth/policies#${table.id}`}>
        <a>
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
            {/* RLS {table.rls_enabled ? 'is' : 'not'} enabled */}
            {!table.rls_enabled
              ? 'RLS is not enabled'
              : `${policies.length == 0 ? 'No' : policies.length} active RLS polic${
                  policies.length > 1 || policies.length == 0 ? 'ies' : 'y'
                }`}
          </Button>
        </a>
      </Link>
    </div>
  )
}

export default GridHeaderActions
