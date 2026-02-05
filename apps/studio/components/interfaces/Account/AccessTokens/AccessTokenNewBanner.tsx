import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'

import { Button, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from 'ui'
import {
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { getResourcePermissions, ACCESS_TOKEN_RESOURCES } from './AccessToken.constants'

interface AccessTokenNewBannerProps<T> {
  token: T
  onClose: () => void
  getTokenValue: (token: T) => string
  getTokenPermissions?: (token: T) => string[] | undefined
  title?: string
  description?: string
}

const PERMISSIONS_COLLAPSE_THRESHOLD = 5

export const AccessTokenNewBanner = <T,>({
  token,
  onClose,
  getTokenValue,
  getTokenPermissions,
  title = 'Successfully generated a new token!',
  description = 'Do copy this access token and store it in a secure place - you will not be able to see it again.',
}: AccessTokenNewBannerProps<T>) => {
  const tokenPermissions = getTokenPermissions?.(token)
  const [permissionsOpen, setPermissionsOpen] = useState(false)
  const shouldCollapse =
    tokenPermissions && tokenPermissions.length > PERMISSIONS_COLLAPSE_THRESHOLD

  const getRealAccess = (resource: string, tokenPermissions: string[]) => {
    const hasPermission = (permission: string) => tokenPermissions.includes(permission)

    const resourcePermissions = getResourcePermissions(resource)
    if (!resourcePermissions) {
      return 'no access'
    }

    const hasRead = resourcePermissions['read']?.some((p) => hasPermission(p)) || false
    const hasWrite = resourcePermissions['write']?.some((p) => hasPermission(p)) || false
    const hasCreate = resourcePermissions['create']?.some((p) => hasPermission(p)) || false
    const hasDelete = resourcePermissions['delete']?.some((p) => hasPermission(p)) || false

    const actions: string[] = []
    if (hasRead) actions.push('read')
    if (hasWrite) actions.push('write')
    if (hasCreate) actions.push('create')
    if (hasDelete) actions.push('delete')

    if (actions.length === 0) {
      return 'no access'
    } else if (actions.length === 1) {
      return actions[0]
    } else if (hasRead && hasWrite && actions.length === 2) {
      return 'read-write'
    } else {
      return actions.join('-')
    }
  }

  const formatAccessText = (access: string) => {
    switch (access) {
      case 'read-write':
        return 'Read-write'
      case 'read only':
        return 'Read only'
      case 'no access':
        return 'No access'
      default:
        return access.charAt(0).toUpperCase() + access.slice(1)
    }
  }

  const groupedPermissionsByAccess = useMemo(() => {
    const grouped: Record<string, string[]> = {}

    if (!tokenPermissions || tokenPermissions.length === 0) {
      return grouped
    }

    ACCESS_TOKEN_RESOURCES.forEach((resource) => {
      const access = getRealAccess(resource.resource, tokenPermissions)
      if (access !== 'no access') {
        const formattedAccess = formatAccessText(access)
        if (!grouped[formattedAccess]) {
          grouped[formattedAccess] = []
        }
        grouped[formattedAccess].push(resource.title)
      }
    })

    return grouped
  }, [tokenPermissions])

  const totalGroupedPermissions = Object.values(groupedPermissionsByAccess).reduce(
    (sum, resources) => sum + resources.length,
    0
  )

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 relative">
        <CardTitle>{title}</CardTitle>
        <Button
          type="text"
          icon={<X />}
          className="w-7 h-7 absolute top-2.5 right-2.5"
          onClick={onClose}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-foreground-light">{description}</p>
        <div className="w-full pb-2">
          <Input
            copy
            readOnly
            size="small"
            className="w-full input-mono"
            id="access-token-value"
            value={getTokenValue(token)}
            onChange={() => { }}
            onCopy={() => toast.success('Token copied to clipboard')}
          />
        </div>

        {tokenPermissions && tokenPermissions.length > 0 && (
          <div className="pt-4 border-t border-default">
            {shouldCollapse ? (
              <Collapsible open={permissionsOpen} onOpenChange={setPermissionsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="text"
                    size="tiny"
                    className="w-full justify-start px-0.5 h-auto text-sm font-medium text-foreground-light hover:text-foreground"
                  >
                    <div className="flex items-center gap-1.5">
                      {permissionsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>Permissions assigned to this token ({totalGroupedPermissions})</span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  <PermissionsList groupedPermissions={groupedPermissionsByAccess} />
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                <h3 className="text-sm font-medium mb-3">Permissions assigned to this token:</h3>
                <PermissionsList groupedPermissions={groupedPermissionsByAccess} />
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface PermissionsListProps {
  groupedPermissions: Record<string, string[]>
}

const PermissionsList = ({ groupedPermissions }: PermissionsListProps) => {
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
