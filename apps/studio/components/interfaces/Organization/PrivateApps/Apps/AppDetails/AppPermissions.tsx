import type { Permission } from '../Apps.constants'

interface AppPermissionsProps {
  orgPermissions: Permission[]
  projectPermissions: Permission[]
  isLoading: boolean
  isLoaded: boolean
}

function PermissionList({ permissions, label }: { permissions: Permission[]; label: string }) {
  return (
    <div className="px-4 py-3 space-y-2">
      <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">{label}</p>
      <div className="space-y-2">
        {permissions.map((p) => (
          <div key={p.id} className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted mt-1.5 shrink-0" />
            <div>
              <p className="text-sm font-mono">{p.label}</p>
              <p className="text-xs text-foreground-light">{p.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AppPermissions({
  orgPermissions,
  projectPermissions,
  isLoading,
  isLoaded,
}: AppPermissionsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Requested Permissions</h3>
      {isLoading ? (
        <div className="text-sm text-foreground-light py-4">Loading permissions...</div>
      ) : (
        <div className="border border-default rounded-lg divide-y divide-default">
          {orgPermissions.length > 0 && (
            <PermissionList permissions={orgPermissions} label="Organization permissions" />
          )}
          {projectPermissions.length > 0 && (
            <PermissionList permissions={projectPermissions} label="Project permissions" />
          )}
          {orgPermissions.length === 0 && projectPermissions.length === 0 && isLoaded && (
            <div className="px-4 py-6 text-center text-sm text-foreground-light">
              No permissions configured
            </div>
          )}
        </div>
      )}
    </div>
  )
}
