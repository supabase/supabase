import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetSection,
  SheetFooter,
  ScrollArea,
  ScrollBar,
  cn,
  Badge,
  Button,
} from 'ui'
import { AccessToken } from 'data/access-tokens/access-tokens-query'
import { DocsButton } from 'components/ui/DocsButton'
import { Card, CardContent } from 'ui'
import { ACCESS_TOKEN_PERMISSIONS } from './AccessToken.constants'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useState } from 'react'

interface ViewTokenPermissionsPanelProps {
  visible: boolean
  token: AccessToken | undefined
  onClose: () => void
  onDeleteToken?: () => void
}

export function ViewTokenPermissionsPanel({
  visible,
  token,
  onClose,
  onDeleteToken,
}: ViewTokenPermissionsPanelProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

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

  // Group resources by access level
  const groupResourcesByAccess = (resources: any[]) => {
    const grouped = {
      'Read only': [] as string[],
      'Read-write': [] as string[],
      'No access': [] as string[],
    }

    resources.forEach((resource) => {
      const access = getDummyAccess(resource.resource)
      const formattedAccess = formatAccessText(access)
      grouped[formattedAccess as keyof typeof grouped].push(resource.title)
    })

    return grouped
  }

  const handleDeleteClick = () => {
    onClose() // Close the sheet when delete dialog appears
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    onDeleteToken?.()
    setIsDeleteModalOpen(false)
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
          <ScrollArea className="flex-1 max-h-[calc(100vh-116px)]">
            <div className="space-y-8 px-5 sm:px-6 py-6">
              {/* Expiry Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Token Details</h3>
                <div className="space-y-2 text-sm text-foreground-light">
                  <div>Created on Dec 1, 2024</div>
                  <div>Expires on Dec 31, 2024</div>
                </div>
              </div>

              {/* Permissions Groups */}
              {ACCESS_TOKEN_PERMISSIONS.map((permissionGroup) => {
                const groupedResources = groupResourcesByAccess(permissionGroup.resources)

                return (
                  <Card key={permissionGroup.name}>
                    <CardContent className="p-4 space-y-4">
                      <h3 className="text-base font-medium text-foreground">
                        {permissionGroup.name}
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(groupedResources).map(([accessLevel, resources]) => {
                          if (resources.length === 0) return null

                          return (
                            <div key={accessLevel} className="space-y-2">
                              <h4 className="text-sm font-medium text-foreground-light">
                                {accessLevel}
                              </h4>
                              <div className="text-sm text-foreground prose">
                                {resources.join(', ')}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
          <SheetFooter className="!justify-end w-full mt-auto pt-4 border-t">
            <div className="flex gap-2">
              <Button type="default" onClick={() => onClose()}>
                Cancel
              </Button>
              <Button type="danger" onClick={handleDeleteClick}>
                Delete token
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmationModal
        visible={isDeleteModalOpen}
        variant={'destructive'}
        title="Confirm to delete"
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      >
        <p className="py-4 text-sm text-foreground-light">
          {`This action cannot be undone. Are you sure you want to delete "${token?.name}" token?`}
        </p>
      </ConfirmationModal>
    </>
  )
}
