import { FC } from 'react'
import Link from 'next/link'
import { Button, IconAlertCircle, Typography } from '@supabase/ui'
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
          <div className="flex items-center space-x-2">
            <div
              className="
            px-2 py-1
            border border-yellow-400  border-opacity-10
            bg-yellow-400 bg-opacity-10  rounded-md flex items-center 
            text-yellow-400 space-x-2 hover:bg-opacity-20
            transition-opacity
            cursor-pointer"
            >
              <IconAlertCircle strokeWidth={2} size={16} />
              <span className="text-xs">RLS not enabled</span>
            </div>
          </div>
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
