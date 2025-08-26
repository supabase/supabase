import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  ScrollArea,
  cn,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { AccessToken } from 'data/access-tokens/access-tokens-query'
import { useScopedAccessTokenQuery } from 'data/scoped-access-tokens/scoped-access-token-query'
import { DocsButton } from 'components/ui/DocsButton'
import { Card, CardContent } from 'ui'
import { ACCESS_TOKEN_PERMISSIONS, FGA_PERMISSIONS } from '../AccessToken.constants'
import { useState } from 'react'
import { Info } from 'lucide-react'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'

interface ViewTokenSheetProps {
  visible: boolean
  tokenId: string | undefined
  onClose: () => void
}

export function ViewTokenSheet({ visible, tokenId, onClose }: ViewTokenSheetProps) {
  const { data: organizations = [] } = useOrganizationsQuery()
  const { data: projects = [] } = useProjectsQuery()

  // Fetch the individual token data
  const {
    data: token,
    isLoading: isTokenLoading,
    error: tokenError,
  } = useScopedAccessTokenQuery(
    { id: tokenId! },
    {
      enabled: visible && !!tokenId,
      retry: 1,
      retryDelay: 1000,
    }
  )

  // Debug: Log query state
  console.log('ViewTokenSheet Debug:', {
    visible,
    tokenId,
    isTokenLoading,
    tokenError,
    token,
    queryEnabled: visible && !!tokenId,
  })

  // Map real permissions to access levels
  const getRealAccess = (resource: string, tokenPermissions: string[]) => {
    // Helper function to check if a permission exists
    const hasPermission = (permission: string) => tokenPermissions.includes(permission)

    // Map resource to its corresponding permissions
    const resourcePermissionMap: Record<string, { read: string; write?: string }> = {
      'user:organizations': {
        read: FGA_PERMISSIONS.USER.ORGANIZATIONS_READ,
        write: FGA_PERMISSIONS.USER.ORGANIZATIONS_WRITE,
      },
      'user:projects': { read: FGA_PERMISSIONS.USER.PROJECTS_READ },
      'user:available_regions': { read: FGA_PERMISSIONS.USER.AVAILABLE_REGIONS_READ },
      'user:snippets': { read: FGA_PERMISSIONS.USER.SNIPPETS_READ },
      'organization:admin': {
        read: FGA_PERMISSIONS.ORGANIZATION.ADMIN_READ,
        write: FGA_PERMISSIONS.ORGANIZATION.ADMIN_WRITE,
      },
      'organization:members': {
        read: FGA_PERMISSIONS.ORGANIZATION.MEMBERS_READ,
        write: FGA_PERMISSIONS.ORGANIZATION.MEMBERS_WRITE,
      },
      'project:admin': {
        read: FGA_PERMISSIONS.PROJECT.ADMIN_READ,
        write: FGA_PERMISSIONS.PROJECT.ADMIN_WRITE,
      },
      'project:advisors': { read: FGA_PERMISSIONS.PROJECT.ADVISORS_READ },
      'project:api_gateway:keys': {
        read: FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_READ,
        write: FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_WRITE,
      },
      'project:auth:config': {
        read: FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_READ,
        write: FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_WRITE,
      },
      'project:auth:signing_keys': {
        read: FGA_PERMISSIONS.PROJECT.AUTH_SIGNING_KEYS_READ,
        write: FGA_PERMISSIONS.PROJECT.AUTH_SIGNING_KEYS_WRITE,
      },
      'project:backups': {
        read: FGA_PERMISSIONS.PROJECT.BACKUPS_READ,
        write: FGA_PERMISSIONS.PROJECT.BACKUPS_WRITE,
      },
      'project:branching:development': {
        read: FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_READ,
        write: FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_WRITE,
      },
      'project:branching:production': {
        read: FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_READ,
        write: FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_WRITE,
      },
      'project:custom_domain': {
        read: FGA_PERMISSIONS.PROJECT.CUSTOM_DOMAIN_READ,
        write: FGA_PERMISSIONS.PROJECT.CUSTOM_DOMAIN_WRITE,
      },
      'project:data_api:config': {
        read: FGA_PERMISSIONS.PROJECT.DATA_API_CONFIG_READ,
        write: FGA_PERMISSIONS.PROJECT.DATA_API_CONFIG_WRITE,
      },
      'project:database': {
        read: FGA_PERMISSIONS.PROJECT.DATABASE_READ,
        write: FGA_PERMISSIONS.PROJECT.DATABASE_WRITE,
      },
      'project:database:config': {
        read: FGA_PERMISSIONS.PROJECT.DATABASE_CONFIG_READ,
        write: FGA_PERMISSIONS.PROJECT.DATABASE_CONFIG_WRITE,
      },
      'project:database:network_bans': {
        read: FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_BANS_READ,
        write: FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_BANS_WRITE,
      },
      'project:database:network_restrictions': {
        read: FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_RESTRICTIONS_READ,
        write: FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_RESTRICTIONS_WRITE,
      },
      'project:database:migrations': {
        read: FGA_PERMISSIONS.PROJECT.DATABASE_MIGRATIONS_READ,
        write: FGA_PERMISSIONS.PROJECT.DATABASE_MIGRATIONS_WRITE,
      },
      'project:database:pooling_config': {
        read: FGA_PERMISSIONS.PROJECT.DATABASE_POOLING_CONFIG_READ,
        write: FGA_PERMISSIONS.PROJECT.DATABASE_POOLING_CONFIG_WRITE,
      },
      'project:database:readonly_config': {
        read: FGA_PERMISSIONS.PROJECT.DATABASE_READONLY_CONFIG_READ,
        write: FGA_PERMISSIONS.PROJECT.DATABASE_READONLY_CONFIG_WRITE,
      },
      'project:database:ssl_config': {
        read: FGA_PERMISSIONS.PROJECT.DATABASE_SSL_CONFIG_READ,
        write: FGA_PERMISSIONS.PROJECT.DATABASE_SSL_CONFIG_WRITE,
      },
      'project:database:webhooks_config': {
        read: FGA_PERMISSIONS.PROJECT.DATABASE_WEBHOOKS_CONFIG_READ,
        write: FGA_PERMISSIONS.PROJECT.DATABASE_WEBHOOKS_CONFIG_WRITE,
      },
      'project:edge_functions': {
        read: FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_READ,
        write: FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_WRITE,
      },
      'project:edge_functions:secrets': {
        read: FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_SECRETS_READ,
        write: FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_SECRETS_WRITE,
      },
      'project:infra:add-ons': {
        read: FGA_PERMISSIONS.PROJECT.INFRA_ADDONS_READ,
        write: FGA_PERMISSIONS.PROJECT.INFRA_ADDONS_WRITE,
      },
      'project:infra:read_replicas': {
        read: FGA_PERMISSIONS.PROJECT.READ_REPLICAS_READ,
        write: FGA_PERMISSIONS.PROJECT.READ_REPLICAS_WRITE,
      },
      'project:snippets': {
        read: FGA_PERMISSIONS.PROJECT.SNIPPETS_READ,
        write: FGA_PERMISSIONS.PROJECT.SNIPPETS_WRITE,
      },
      'project:storage': {
        read: FGA_PERMISSIONS.PROJECT.STORAGE_READ,
        write: FGA_PERMISSIONS.PROJECT.STORAGE_WRITE,
      },
      'project:storage:config': {
        read: FGA_PERMISSIONS.PROJECT.STORAGE_CONFIG_READ,
        write: FGA_PERMISSIONS.PROJECT.STORAGE_CONFIG_WRITE,
      },
      'project:telemetry:logs': { read: FGA_PERMISSIONS.PROJECT.TELEMETRY_LOGS_READ },
      'project:telemetry:usage': { read: FGA_PERMISSIONS.PROJECT.TELEMETRY_USAGE_READ },
    }

    const permissions = resourcePermissionMap[resource]
    if (!permissions) {
      console.warn(`Unknown resource: ${resource}`)
      return 'no access'
    }

    const hasRead = hasPermission(permissions.read)
    const hasWrite = permissions.write ? hasPermission(permissions.write) : false

    if (hasRead && hasWrite) {
      return 'read-write'
    } else if (hasRead) {
      return 'read only'
    } else {
      return 'no access'
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

  // Group resources by access level
  const groupResourcesByAccess = (resources: any[]) => {
    const grouped = {
      'Read only': [] as string[],
      'Read-write': [] as string[],
      'No access': [] as string[],
    }

    // Only process if we have token permissions
    if (!token?.permissions) {
      return grouped
    }

    resources.forEach((resource) => {
      const access = getRealAccess(resource.resource, token.permissions)
      const formattedAccess = formatAccessText(access)
      grouped[formattedAccess as keyof typeof grouped].push(resource.title)
    })

    return grouped
  }

  // Get resource access information from token data
  const getResourceAccessInfo = () => {
    const resources: Array<{ name: string; type: string; identifier: string }> = []

    // Debug: Log token data to understand the structure
    console.log('Token data:', token)
    console.log('Token organization_slugs:', token?.organization_slugs)
    console.log('Token project_refs:', token?.project_refs)

    // Check if this is a scoped access token with organization_slugs
    const organizationSlugs = token?.organization_slugs
    if (organizationSlugs && Array.isArray(organizationSlugs) && organizationSlugs.length > 0) {
      organizationSlugs.forEach((orgSlug: string) => {
        const org = organizations.find((o) => o.slug === orgSlug)
        resources.push({
          name: org?.name || orgSlug,
          type: 'Organization',
          identifier: orgSlug,
        })
      })
    }

    // Check if this is a scoped access token with project_refs
    const projectRefs = token?.project_refs
    if (projectRefs && Array.isArray(projectRefs) && projectRefs.length > 0) {
      projectRefs.forEach((projectRef: string) => {
        const project = projects.find((p) => p.ref === projectRef)
        resources.push({
          name: project?.name || projectRef,
          type: 'Project',
          identifier: projectRef,
        })
      })
    }

    // For regular access tokens (V0 scope), show that they have access to all resources
    // This is handled in the render logic below

    return resources
  }

  return (
    <>
      <Sheet open={visible} onOpenChange={() => onClose()}>
        <SheetContent
          showClose={false}
          size="default"
          className="!min-w-[600px] flex flex-col h-full gap-0"
        >
          <SheetHeader
            className={cn('flex flex-row justify-between gap-x-4 items-center border-b')}
          >
            <p className="truncate" title={`Manage access for ${token?.name}`}>
              View access for {token?.name}
            </p>
            <DocsButton href="https://supabase.com/docs/guides/platform/access-control" />
          </SheetHeader>
          <ScrollArea className="flex-1 max-h-[calc(100vh-60px)]">
            <div className="space-y-8 px-5 sm:px-6 py-6">
              {isTokenLoading && (
                <div className="flex items-center justify-center py-8">
                  <p className="text-foreground-light">Loading token information...</p>
                </div>
              )}

              {tokenError && (
                <div className="flex items-center justify-center py-8">
                  <p className="text-foreground-light text-red-500">
                    Error loading token information. Please try again.
                  </p>
                </div>
              )}

              {token && (
                <>
                  {/* Token Details Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Token Information</h3>
                    <Card className="w-full overflow-hidden bg-surface-100">
                      <CardContent className="p-0">
                        <Table className="p-5 table-auto">
                          <TableHeader>
                            <TableRow className="bg-200">
                              <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[60%]">
                                Info
                              </TableHead>
                              <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                                Date
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <p className="truncate text-foreground-light">Created</p>
                              </TableCell>
                              <TableCell>
                                <span className="text-foreground">
                                  {token?.created_at
                                    ? new Date(token.created_at).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : 'Unknown'}
                                </span>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <p className="truncate text-foreground-light">Last used</p>
                              </TableCell>
                              <TableCell>
                                <span className="text-foreground">
                                  {token?.last_used_at
                                    ? new Date(token.last_used_at).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : 'Never'}
                                </span>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <p className="truncate text-foreground-light">Expires</p>
                              </TableCell>
                              <TableCell>
                                <span className="text-foreground">
                                  {token?.expires_at
                                    ? new Date(token.expires_at).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : 'Never'}
                                </span>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Resource Access Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Resource Access</h3>
                    <Card className="w-full overflow-hidden bg-surface-100">
                      <CardContent className="p-0">
                        <Table className="p-5 table-auto">
                          <TableHeader>
                            <TableRow className="bg-200">
                              <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[60%]">
                                Resource
                              </TableHead>
                              <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                                Type
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getResourceAccessInfo().length > 0 ? (
                              getResourceAccessInfo().map((resource, index) => (
                                <TableRow key={`${resource.type}-${resource.identifier}-${index}`}>
                                  <TableCell>
                                    <p className="truncate text-foreground">{resource.name}</p>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-foreground-light">{resource.type}</span>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={2}>
                                  <p className="text-foreground-light text-center py-4">
                                    {token?.organization_slugs &&
                                    token.organization_slugs.length > 0
                                      ? 'This token has access to specific organizations and projects.'
                                      : 'This token has access to all resources.'}
                                  </p>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Permissions Groups */}
                  {ACCESS_TOKEN_PERMISSIONS.map((permissionGroup) => {
                    const groupedResources = groupResourcesByAccess(permissionGroup.resources)

                    return (
                      <div key={permissionGroup.name} className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground">
                          {permissionGroup.name}
                        </h3>
                        <Card className="w-full overflow-hidden bg-surface-100">
                          <CardContent className="p-0">
                            <Table className="p-5 table-auto">
                              <TableHeader>
                                <TableRow className="bg-200">
                                  <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[60%]">
                                    Permission
                                  </TableHead>
                                  <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                                    Access
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Object.entries(groupedResources).map(
                                  ([accessLevel, resources]) => {
                                    if (resources.length === 0) return null

                                    return resources.map((resource) => (
                                      <TableRow key={`${accessLevel}-${resource}`}>
                                        <TableCell>
                                          <p className="truncate text-foreground">{resource}</p>
                                        </TableCell>
                                        <TableCell>
                                          <span className="text-foreground-light">
                                            {accessLevel}
                                          </span>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  }
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
