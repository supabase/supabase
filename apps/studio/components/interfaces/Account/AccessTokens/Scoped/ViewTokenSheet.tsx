import {
  Sheet,
  SheetContent,
  SheetHeader,
  ScrollArea,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { useScopedAccessTokenQuery } from 'data/scoped-access-tokens/scoped-access-token-query'
import { DocsButton } from 'components/ui/DocsButton'
import { Card, CardContent } from 'ui'
import { ACCESS_TOKEN_PERMISSIONS, PERMISSION_MAP } from '../AccessToken.constants'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsInfiniteQuery } from 'data/projects/projects-infinite-query'
import { useMemo } from 'react'

interface ViewTokenSheetProps {
  visible: boolean
  tokenId: string | undefined
  onClose: () => void
}

export function ViewTokenSheet({ visible, tokenId, onClose }: ViewTokenSheetProps) {
  const { data: organizations = [] } = useOrganizationsQuery()
  const { data: projectsData } = useProjectsInfiniteQuery({
    limit: 100,
  })

  const projects =
    useMemo(() => projectsData?.pages.flatMap((page) => page.projects), [projectsData]) ?? []

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

  const getRealAccess = (resource: string, tokenPermissions: string[]) => {
    const hasPermission = (permission: string) => tokenPermissions.includes(permission)

    // Get the permissions for this resource from PERMISSION_MAP
    const resourcePermissions = PERMISSION_MAP[resource]
    if (!resourcePermissions) {
      console.warn(`Unknown resource: ${resource}`)
      return 'no access'
    }

    // Check what permissions the token has for this resource
    const hasRead = resourcePermissions['read']?.some((p) => hasPermission(p)) || false
    const hasWrite = resourcePermissions['read-write']?.some((p) => hasPermission(p)) || false

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

  const groupResourcesByAccess = (resources: any[]) => {
    const grouped = {
      'Read only': [] as string[],
      'Read-write': [] as string[],
      'No access': [] as string[],
    }

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

  const getResourceAccessInfo = () => {
    const resources: Array<{ name: string; type: string; identifier: string }> = []

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
