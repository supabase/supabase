import dayjs from 'dayjs'
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
import { ACCESS_TOKEN_RESOURCES } from '../AccessToken.constants'
import { useMemo } from 'react'
import { formatAccessText, getRealAccess } from '../AccessToken.utils'
import { useOrgAndProjectData } from '../hooks/useOrgAndProjectData'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

interface ViewTokenSheetProps {
  visible: boolean
  tokenId: string | undefined
  onClose: () => void
}

export function ViewTokenSheet({ visible, tokenId, onClose }: ViewTokenSheetProps) {
  const { organizations, projects } = useOrgAndProjectData()

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

  const groupedResourcesByAccess = useMemo(() => {
    const grouped: Record<string, string[]> = {}

    if (!token?.permissions) {
      return grouped
    }

    ACCESS_TOKEN_RESOURCES.forEach((resource) => {
      const access = getRealAccess(resource.resource, token.permissions)
      if (access !== 'no access') {
        const formattedAccess = formatAccessText(access)
        if (!grouped[formattedAccess]) {
          grouped[formattedAccess] = []
        }
        grouped[formattedAccess].push(resource.title)
      }
    })

    return grouped
  }, [token?.permissions])

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
            <DocsButton href="https://supabase.com/docs/reference/api/introduction" />
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
                                {token?.created_at ? (
                                  <TimestampInfo
                                    utcTimestamp={token.created_at}
                                    label={dayjs(token.created_at).format('DD MMM YYYY')}
                                    className="text-sm"
                                  />
                                ) : (
                                  <span className="text-foreground">Unknown</span>
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <p className="truncate text-foreground-light">Last used</p>
                              </TableCell>
                              <TableCell>
                                {token?.last_used_at ? (
                                  <TimestampInfo
                                    utcTimestamp={token.last_used_at}
                                    label={dayjs(token.last_used_at).fromNow()}
                                    className="text-sm"
                                  />
                                ) : (
                                  <span className="text-foreground">Never</span>
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <p className="truncate text-foreground-light">Expires</p>
                              </TableCell>
                              <TableCell>
                                {token?.expires_at ? (
                                  <TimestampInfo
                                    utcTimestamp={token.expires_at}
                                    label={dayjs(token.expires_at).format('DD MMM YYYY')}
                                    className="text-sm"
                                  />
                                ) : (
                                  <span className="text-foreground">Never</span>
                                )}
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
                                    {(token?.organization_slugs &&
                                      token.organization_slugs.length > 0) ||
                                    (token?.project_refs && token.project_refs.length > 0)
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

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Permissions</h3>
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
                            {Object.keys(groupedResourcesByAccess).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={2}>
                                  <p className="text-foreground-light text-center py-4">
                                    No permissions configured for this token.
                                  </p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              Object.entries(groupedResourcesByAccess).map(
                                ([accessLevel, resources]) => {
                                  return resources.map((resource) => (
                                    <TableRow key={`${accessLevel}-${resource}`}>
                                      <TableCell>
                                        <p className="truncate text-foreground capitalize">
                                          {resource}
                                        </p>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-foreground-light">
                                          {formatAccessText(accessLevel)}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                }
                              )
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
