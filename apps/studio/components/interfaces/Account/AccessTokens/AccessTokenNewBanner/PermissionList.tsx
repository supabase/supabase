interface PermissionsListProps {
  groupedPermissions: Record<string, string[]>
}

export const PermissionsList = ({ groupedPermissions }: PermissionsListProps) => {
  return (
    <div className="gap-2 flex flex-col">
      {Object.entries(groupedPermissions).map(([accessLevel, resources]) => (
        <div key={accessLevel} className="flex flex-wrap gap-1.5">
          <span className="text-xs text-foreground-lighter font-mono uppercase tracking-wide">
            {accessLevel}:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {resources.map((resource, index) => (
              <span
                key={`${accessLevel}-${resource}`}
                className="text-xs text-foreground capitalize"
              >
                {resource}
                {index < resources.length - 1 ? ',' : '.'}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
