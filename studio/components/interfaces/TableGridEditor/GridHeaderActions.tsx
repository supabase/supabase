import { FC } from 'react'
import Link from 'next/link'
import { Badge, Button, IconAlertCircle, Typography } from '@supabase/ui'
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
      {!table.rls_enabled && (
        <Link href={urlToRLSPolicies}>
          <Button type="warning" icon={<IconAlertCircle strokeWidth={2} size={14} />}>
            RLS not enabled
          </Button>
        </Link>
      )}
      {/* <Button type="text">
        <Typography.Text small code>
          Shortcuts
        </Typography.Text>
      </Button> */}
    </div>
  )
}

export default GridHeaderActions
