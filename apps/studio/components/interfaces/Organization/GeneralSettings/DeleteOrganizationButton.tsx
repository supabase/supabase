import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useOrganizationDeleteMutation } from 'data/organizations/organization-delete-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'

export const DeleteOrganizationButton = () => {
  const router = useRouter()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { slug: orgSlug, name: orgName } = selectedOrganization ?? {}

  const [isOpen, setIsOpen] = useState(false)

  const [_, setLastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const { can: canDeleteOrganization } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'organizations'
  )

  const { mutate: deleteOrganization, isPending: isDeleting } = useOrganizationDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted ${orgName}`)
      setLastVisitedOrganization('')
      router.push('/organizations')
    },
  })

  const onConfirmDelete = () => {
    if (!canDeleteOrganization) {
      toast.error('You do not have permission to delete this organization')
      return
    }
    if (!orgSlug) {
      console.error('Org slug is required')
      return
    }
    deleteOrganization({ slug: orgSlug })
  }

  return (
    <>
      <div className="mt-2">
        <ButtonTooltip
          type="danger"
          disabled={!canDeleteOrganization || !orgSlug}
          loading={!orgSlug}
          onClick={() => setIsOpen(true)}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canDeleteOrganization
                ? 'You need additional permissions to delete this organization'
                : undefined,
            },
          }}
        >
          Delete organization
        </ButtonTooltip>
      </div>
      <TextConfirmModal
        visible={isOpen}
        size="small"
        variant="destructive"
        title="Delete organization"
        loading={isDeleting}
        confirmString={orgSlug ?? ''}
        confirmPlaceholder="Enter the string above"
        confirmLabel="I understand, delete this organization"
        onConfirm={onConfirmDelete}
        onCancel={() => setIsOpen(false)}
      >
        <p className="text-sm text-foreground-lighter">
          This action <span className="text-foreground">cannot</span> be undone. This will
          permanently delete the <span className="text-foreground">{orgName}</span> organization and
          remove all of its projects.
        </p>
      </TextConfirmModal>
    </>
  )
}
