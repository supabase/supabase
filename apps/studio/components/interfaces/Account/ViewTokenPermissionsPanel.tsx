import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetSection,
  ScrollArea,
  ScrollBar,
  cn,
  Badge,
} from 'ui'
import { AccessToken } from 'data/access-tokens/access-tokens-query'
import { DocsButton } from 'components/ui/DocsButton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui/src/components/shadcn/ui/table'
import { Card, CardContent } from 'ui'
import { ACCESS_TOKEN_PERMISSIONS } from './AccessToken.constants'

interface ViewTokenPermissionsPanelProps {
  visible: boolean
  token: AccessToken | undefined
  onClose: () => void
}

export function ViewTokenPermissionsPanel({
  visible,
  token,
  onClose,
}: ViewTokenPermissionsPanelProps) {
  // Dummy access settings for demonstration
  const getDummyAccess = (resource: string) => {
    // Define realistic access patterns based on resource type
    if (resource.includes('organization:admin')) {
      return 'read only'
    } else if (resource.includes('organization:members')) {
      return 'read-write'
    } else if (resource.includes('project:admin')) {
      return 'read-write'
    } else if (resource.includes('project:database')) {
      return 'read-write'
    } else if (resource.includes('project:storage')) {
      return 'read-write'
    } else if (resource.includes('project:auth')) {
      return 'read only'
    } else if (resource.includes('project:edge_functions')) {
      return 'read-write'
    } else if (resource.includes('project:telemetry')) {
      return 'read only'
    } else if (resource.includes('project:backups')) {
      return 'read only'
    } else if (resource.includes('project:branching')) {
      return 'no access'
    } else if (resource.includes('project:custom_domain')) {
      return 'read only'
    } else if (resource.includes('project:infra')) {
      return 'no access'
    } else if (resource.includes('project:snippets')) {
      return 'read-write'
    } else if (resource.includes('project:advisors')) {
      return 'read only'
    } else if (resource.includes('project:api_gateway')) {
      return 'read-write'
    } else if (resource.includes('project:data_api')) {
      return 'read only'
    } else {
      return 'read only'
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

  return (
    <Sheet open={visible} onOpenChange={() => onClose()}>
      <SheetContent showClose={false} size="default" className={cn('!min-w-[600px]')}>
        <div className={cn('flex flex-col grow w-full')}>
          <SheetHeader
            className={cn('py-3 flex flex-row justify-between gap-x-4 items-center border-b')}
          >
            <p className="truncate" title={`Manage access for ${token?.name}`}>
              View access for {token?.name}
            </p>
            <DocsButton href="https://supabase.com/docs/guides/platform/access-control" />
          </SheetHeader>
          <SheetSection className="h-full overflow-auto flex flex-col gap-y-4 p-0">
            <ScrollArea className="h-[calc(100vh-52px)]">
              <div className="space-y-8 p-4">
                {/* Expiry Section */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Token Expiry</h3>
                      </div>
                      <Badge variant="success">Dec 31, 2024</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Permissions Tables */}
                {ACCESS_TOKEN_PERMISSIONS.map((permissionGroup) => (
                  <div className="space-y-4 flex flex-col" key={permissionGroup.name}>
                    <h3 className="text-base font-medium text-foreground">
                      {permissionGroup.name}
                    </h3>
                    <Card className="overflow-hidden">
                      <CardContent className="p-0 rounded">
                        <Table>
                          <TableHeader className="overflow-hidden">
                            <TableRow className="bg-200">
                              <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[60%]">
                                Scope
                              </TableHead>
                              <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[40%]">
                                Access
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {permissionGroup.resources.map((resource) => (
                              <TableRow key={resource.resource}>
                                <TableCell>
                                  <div>
                                    <p className="text-sm text-foreground">{resource.title}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-foreground-light">
                                    {formatAccessText(getDummyAccess(resource.resource))}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
              <ScrollBar />
            </ScrollArea>
          </SheetSection>
          {/* <SheetFooter className="flex items-center !justify-end px-5 py-4 w-full border-t">
            <Button type="default" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => onClose()}>
              Save changes
            </Button>
          </SheetFooter> */}
        </div>
      </SheetContent>
    </Sheet>
  )
}
