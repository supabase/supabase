import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AutoTextArea from 'components/to-be-cleaned/forms/AutoTextArea'
import { executeSql } from 'data/sql/execute-sql-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { timeout } from 'lib/helpers'
import { Button } from 'ui'
import { Loader } from 'lucide-react'

// Removes some auto-generated Postgrest text
// Ideally PostgREST wouldn't add this if there is already a comment
const temp_removePostgrestText = (content: string) => {
  const postgrestTextPk = `Note:\nThis is a Primary Key.<pk/>`
  const postgrestTextFk = `Note:\nThis is a Foreign Key to`
  const pkTextPos = content.lastIndexOf(postgrestTextPk)
  const fkTextPos = content.lastIndexOf(postgrestTextFk)

  let cleansed = content
  if (pkTextPos >= 0) cleansed = cleansed.substring(0, pkTextPos)
  if (fkTextPos >= 0) cleansed = cleansed.substring(0, fkTextPos)
  return cleansed
}

interface DescrptionProps {
  content: string
  metadata: { table?: string; column?: string; rpc?: string }
  onChange: (value: string) => void
}

const Description = ({ content, metadata, onChange = noop }: DescrptionProps) => {
  const contentText = temp_removePostgrestText(content || '').trim()
  const [value, setValue] = useState(contentText)
  const [isUpdating, setIsUpdating] = useState(false)
  const { project } = useProjectContext()

  const { table, column, rpc } = metadata

  const hasChanged = value != contentText
  const animateCss = `transition duration-150`

  const canUpdateDescription = useCheckPermissions(PermissionAction.TENANT_SQL_QUERY, '*')

  const updateDescription = async () => {
    if (isUpdating || !canUpdateDescription) return false

    setIsUpdating(true)
    let query = ''
    let description = value.replaceAll("'", "''")
    if (table && column)
      query = `comment on column public."${table}"."${column}" is '${description}';`
    if (table && !column) query = `comment on table public."${table}" is '${description}';`
    if (rpc) query = `comment on function "${rpc}" is '${description}';`

    if (query) {
      try {
        await executeSql({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          sql: query,
        })
        // [Joshen] Temp fix, immediately refreshing the docs fetches stale state
        await timeout(500)
        toast.success(`Successfully updated description`)
      } catch (error: any) {
        toast.error(`Failed to update description: ${error.message}`)
      }
    }

    onChange(value)
    setIsUpdating(false)
  }

  if (!canUpdateDescription) {
    return (
      <span className={`block ${value ? 'text-foreground' : ''}`}>{value || 'No description'}</span>
    )
  }

  return (
    <div className="space-y-2">
      <AutoTextArea
        className="w-full"
        placeholder="Click to edit."
        value={value}
        onChange={(e: any) => setValue(e.target.value)}
      />
      <div
        className={`flex items-center gap-2 ${
          hasChanged ? 'opacity-100' : 'h-0 cursor-default opacity-0'
        } ${animateCss}`}
      >
        <Button
          type="default"
          disabled={!hasChanged}
          onClick={() => {
            setValue(contentText)
            setIsUpdating(false)
          }}
        >
          Cancel
        </Button>
        <Button disabled={!hasChanged} onClick={updateDescription}>
          {isUpdating ? (
            <Loader className="mx-auto animate-spin" size={14} strokeWidth={2} />
          ) : (
            <span>Save</span>
          )}
        </Button>
      </div>
    </div>
  )
}

export default Description
