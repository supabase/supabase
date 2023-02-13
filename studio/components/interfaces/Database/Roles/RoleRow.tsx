import { FC } from 'react'
import { PostgresRole } from '@supabase/postgres-meta'
import { IconChevronUp, IconCheck, IconX, Collapsible } from 'ui'

interface Props {
  role: PostgresRole
  isExpanded: boolean
  onClick: () => void
}

const RoleRow: FC<Props> = ({ role, isExpanded, onClick }) => {
  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={onClick}
      className={[
        'bg-scale-100 dark:bg-scale-300',
        'hover:bg-scale-200 dark:hover:bg-scale-500',
        'data-open:bg-scale-200 dark:data-open:bg-scale-500',
        'border-scale-300 dark:border-scale-500 hover:border-scale-500',
        'dark:hover:border-scale-700 data-open:border-scale-700',
        'data-open:pb-px col-span-12 mx-auto',
        '-space-y-px overflow-hidden',
        'border border-b-0 last:border-b shadow transition hover:z-50',
        'first:rounded-tl first:rounded-tr',
        'last:rounded-bl last:rounded-br',
      ].join(' ')}
    >
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="group flex w-full items-center justify-between rounded py-3 px-6 text-scale-1200"
        >
          <div className="flex items-start space-x-3">
            <IconChevronUp
              className="text-scale-800 transition data-open-parent:rotate-0 data-closed-parent:rotate-180"
              strokeWidth={2}
              width={14}
            />
            <div className="space-x-2 flex items-center">
              <p className="text-left text-sm">{role.name}</p>
              <p className="text-left text-sm text-scale-1000">(ID: {role.id})</p>
            </div>
          </div>
          <p
            className={`text-sm ${
              role.active_connections > 0 ? 'text-scale-1100' : 'text-scale-1000'
            }`}
          >
            {role.active_connections} connections
          </p>
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <div className="group border-t border-scale-500 bg-scale-100 py-6 px-6 text-scale-1200 dark:bg-scale-300">
          <div className="mx-auto py-4 px-6 space-y-2">
            <div className="flex items-center space-x-2">
              {role.is_superuser ? (
                <IconCheck className="text-brand-900" strokeWidth={2} />
              ) : (
                <IconX className="text-scale-1000" strokeWidth={2} />
              )}
              <p className="text-sm">User is a Superuser</p>
            </div>
            <div className="flex items-center space-x-2">
              {role.can_login ? (
                <IconCheck className="text-brand-900" strokeWidth={2} />
              ) : (
                <IconX className="text-scale-1000" strokeWidth={2} />
              )}
              <p className="text-sm">User can login</p>
            </div>
            <div className="flex items-center space-x-2">
              {role.can_create_role ? (
                <IconCheck className="text-brand-900" strokeWidth={2} />
              ) : (
                <IconX className="text-scale-1000" strokeWidth={2} />
              )}
              <p className="text-sm">User can create roles</p>
            </div>
            <div className="flex items-center space-x-2">
              {role.can_create_db ? (
                <IconCheck className="text-brand-900" strokeWidth={2} />
              ) : (
                <IconX className="text-scale-1000" strokeWidth={2} />
              )}
              <p className="text-sm">User can create databases</p>
            </div>
            <div className="flex items-center space-x-2">
              {role.is_replication_role ? (
                <IconCheck className="text-brand-900" strokeWidth={2} />
              ) : (
                <IconX className="text-scale-1000" strokeWidth={2} />
              )}
              <p className="text-sm">
                User can initiate streaming replication and put the system in and out of backup mode
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {role.can_bypass_rls ? (
                <IconCheck className="text-brand-900" strokeWidth={2} />
              ) : (
                <IconX className="text-scale-1000" strokeWidth={2} />
              )}
              <p className="text-sm">User bypasses every row level security policy</p>
            </div>
          </div>
        </div>
      </Collapsible.Content>
    </Collapsible>
  )
}

export default RoleRow
