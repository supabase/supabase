import { PostgresPolicy } from '@supabase/postgres-meta'
import Panel from 'components/ui/Panel'
import { RealtimeChannel } from 'data/realtime/channels-query'
import { isEmpty } from 'lodash'
import { Antenna, ChevronDown, MoreVertical } from 'lucide-react'
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

type RealtimePoliciesChannelRowProps = {
  channel: RealtimeChannel
  policies: PostgresPolicy[]
  onSelectPolicyAdd: (t: string) => void
  onSelectPolicyEdit: (p: PostgresPolicy) => void
  onSelectPolicyDelete: (s: PostgresPolicy) => void
}

export const RealtimePoliciesChannelRow = ({
  channel,
  policies,
  onSelectPolicyAdd,
  onSelectPolicyEdit,
  onSelectPolicyDelete,
}: RealtimePoliciesChannelRowProps) => {
  return (
    <Panel
      title={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center flex-row space-x-4">
            <Antenna className="text-foreground-light w-4 h-4" />
            <h4 className="text-lg">{channel.name}</h4>
          </div>
          <div className="flex items-center">
            <Button
              type="default"
              className="rounded-r-none"
              onClick={() => onSelectPolicyAdd('channels')}
            >
              New policy
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="default"
                  className="rounded-l-none px-[4px] py-[5px]"
                  icon={<ChevronDown strokeWidth={1} />}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuItem key="broadcast" onClick={() => onSelectPolicyAdd('broadcasts')}>
                  New broadcast policy
                </DropdownMenuItem>
                <DropdownMenuItem key="presence" onClick={() => onSelectPolicyAdd('presences')}>
                  New presence policy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      }
    >
      {policies.length === 0 ? (
        <div className="p-4 px-6">
          <p className="text-sm text-foreground-lighter">No policies created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 divide-y [[data-theme*=dark]_&]:divide-dark">
          {policies.map((policy) => (
            <PolicyRow
              key={policy.name}
              policy={policy}
              onSelectPolicyEdit={onSelectPolicyEdit}
              onSelectPolicyDelete={onSelectPolicyDelete}
            />
          ))}
          {policies.length !== 0 ? (
            <div className="px-6 py-2">
              <p className="text-sm text-foreground-light">
                {isEmpty(channel)
                  ? `${policies.length} polic${policies.length > 1 ? 'ies' : 'y'} that are not tied to any channels`
                  : `${policies.length} polic${policies.length > 1 ? 'ies' : 'y'} in ${channel.name}`}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </Panel>
  )
}
