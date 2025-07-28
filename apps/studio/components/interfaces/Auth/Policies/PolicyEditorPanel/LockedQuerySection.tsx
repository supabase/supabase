import { PostgresPolicy } from '@supabase/postgres-meta'
import { Lock } from 'lucide-react'

interface LockedCreateQuerySection {
  schema: string
  selectedPolicy?: PostgresPolicy
  formFields: { name: string; table: string; behavior: string; command: string; roles: string }
}

export const LockedCreateQuerySection = ({
  schema,
  selectedPolicy,
  formFields,
}: LockedCreateQuerySection) => {
  const isEditing = selectedPolicy !== undefined
  const { name, table, behavior, command, roles } = formFields

  return (
    <div className="bg-surface-300 pt-2 pb-1">
      <div className="flex items-center justify-between px-5 mb-1">
        <div className="flex items-center">
          <div className="pl-0.5 pr-5 flex items-center justify-center">
            <Lock size={14} className="text-foreground-lighter" />
          </div>
          <p className="text-xs text-foreground-lighter font-mono uppercase">
            Use options above to edit
          </p>
        </div>
      </div>
      <div className="flex items-start" style={{ fontSize: '14px' }}>
        <p className="px-6 font-mono text-sm text-foreground-light select-none">1</p>
        <p className="font-mono tracking-tighter">
          <span className="text-[#569cd6]">{isEditing ? 'alter' : 'create'}</span> policy "
          {name.length === 0 ? 'policy_name' : name}"
        </p>
      </div>
      <div className="flex items-start" style={{ fontSize: '14px' }}>
        <p className="px-6 font-mono text-sm text-foreground-light select-none">2</p>
        <p className="font-mono tracking-tighter">
          <span className="text-[#569cd6]">on</span> "{schema}"."
          {table}"
        </p>
      </div>
      {!isEditing && (
        <>
          <div className="flex items-start" style={{ fontSize: '14px' }}>
            <p className="px-6 font-mono text-sm text-foreground-light select-none">3</p>
            <p className="font-mono tracking-tighter">
              <span className="text-[#569cd6]">as</span> {behavior.toLocaleUpperCase()}
            </p>
          </div>
          <div className="flex items-start" style={{ fontSize: '14px' }}>
            <p className="px-6 font-mono text-sm text-foreground-light select-none">4</p>
            <p className="font-mono tracking-tighter">
              <span className="text-[#569cd6]">for</span> {command.toLocaleUpperCase()}
            </p>
          </div>
        </>
      )}
      <div className="flex items-start" style={{ fontSize: '14px' }}>
        <p className="px-6 font-mono text-sm text-foreground-light select-none">5</p>
        <p className="font-mono tracking-tighter">
          <span className="text-[#569cd6]">to</span> {roles.length === 0 ? 'public' : roles}
        </p>
      </div>
      <div className="flex items-start" style={{ fontSize: '14px' }}>
        <p className="px-6 font-mono text-sm text-foreground-light select-none">6</p>
        <p className="font-mono tracking-tighter">
          <span className="text-[#569cd6]">{command === 'insert' ? 'with check' : 'using'}</span>{' '}
          <span className="text-[#ffd700]">(</span>
        </p>
      </div>
    </div>
  )
}

export const LockedRenameQuerySection = ({
  oldName,
  newName,
  schema,
  table,
  lineNumber,
}: {
  oldName: string
  newName: string
  schema: string
  table: string
  lineNumber: number
}) => {
  return (
    <div className="bg-surface-300 py-1">
      <div className="flex items-center" style={{ fontSize: '14px' }}>
        <div className="w-[57px]">
          <p className="w-[31px] flex justify-end font-mono text-sm text-foreground-light select-none">
            {lineNumber}
          </p>
        </div>
        <p className="font-mono tracking-tighter">
          <span className="text-[#569cd6]">alter</span> policy {oldName}
        </p>
      </div>
      <div className="flex items-center" style={{ fontSize: '14px' }}>
        <div className="w-[57px]">
          <p className="w-[31px] flex justify-end font-mono text-sm text-foreground-light select-none">
            {lineNumber + 1}
          </p>
        </div>
        <p className="font-mono tracking-tighter">
          <span className="text-[#569cd6]">on</span> "{schema}"."{table}"
        </p>
      </div>
      <div className="flex items-center" style={{ fontSize: '14px' }}>
        <div className="w-[57px]">
          <p className="w-[31px] flex justify-end font-mono text-sm text-foreground-light select-none">
            {lineNumber + 2}
          </p>
        </div>
        <p className="font-mono tracking-tighter">
          <span className="text-[#569cd6]">rename</span> to "{newName}";
        </p>
      </div>
    </div>
  )
}
