import { PostgresPolicy } from '@supabase/postgres-meta'
import Panel from 'components/ui/Panel'
import { MoreVertical } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconEdit,
  IconTrash,
} from 'ui'

interface PolicyRowProps {
  policy: PostgresPolicy
  onSelectPolicyEdit: (p: PostgresPolicy) => void
  onSelectPolicyDelete: (s: PostgresPolicy) => void
}

export const PolicyRow = ({ policy, onSelectPolicyEdit, onSelectPolicyDelete }: PolicyRowProps) => {
  const { name, command } = policy
  return (
    <div className="group">
      <Panel.Content className="flex justify-between gap-2 border-b border-overlay py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="font-mono text-xs text-foreground-lighter">{command}</div>
          <div className="flex flex-col gap-2 lg:flex-row">
            <span className="truncate text-sm text-foreground">{name}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="default"
              style={{ paddingLeft: 4, paddingRight: 4 }}
              icon={<MoreVertical />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem className="space-x-2" onClick={() => onSelectPolicyEdit(policy)}>
              <IconEdit size={14} />
              <p>Edit</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="space-x-2" onClick={() => onSelectPolicyDelete(policy)}>
              <IconTrash size={14} />
              <p>Delete</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Panel.Content>
    </div>
  )
}
