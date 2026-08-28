export const DATABASE_PASSWORD_VALUE = '__database_password__'

export function resolveSelectedTemporaryAccessRole({
  selectedRole,
  activeRoles,
}: {
  selectedRole: string | null
  activeRoles: string[]
}): string {
  if (selectedRole === DATABASE_PASSWORD_VALUE) return DATABASE_PASSWORD_VALUE
  if (selectedRole && activeRoles.includes(selectedRole)) return selectedRole
  return activeRoles[0] ?? DATABASE_PASSWORD_VALUE
}

export type PopoverDirectConnectionBehavior =
  | { type: 'copy'; role?: string }
  | { type: 'open-connect' }
  | { type: 'pending' }

export function resolvePopoverDirectConnectionBehavior({
  isJitEnabled,
  isPending,
  activeRoles,
}: {
  isJitEnabled: boolean
  isPending: boolean
  activeRoles: string[]
}): PopoverDirectConnectionBehavior {
  if (!isJitEnabled) return { type: 'copy' }
  if (isPending) return { type: 'pending' }
  if (activeRoles.length > 1) return { type: 'open-connect' }
  if (activeRoles.length === 1) return { type: 'copy', role: activeRoles[0] }
  return { type: 'copy' }
}
