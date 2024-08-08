import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useOrganizationDeleteMutation } from 'data/organizations/organization-delete-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { Button, Form, Input, Modal } from 'ui'

const DeleteOrganizationButton = () => {
  const router = useRouter()
  const selectedOrganization = useSelectedOrganization()
  const { slug: orgSlug, name: orgName } = selectedOrganization ?? {}

  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState('')

  const canDeleteOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const { mutate: deleteOrganization, isLoading: isDeleting } = useOrganizationDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted ${orgName}`)
      router.push('/projects')
    },
  })

  const onValidate = (values: any) => {
    const errors: any = {}
    if (!values.orgName) {
      errors.orgName = 'Enter the name of the organization.'
    }
    if (values.orgName !== orgSlug) {
      errors.orgName = 'Value entered does not match the value above.'
    }
    return errors
  }

  const onConfirmDelete = async (values: any) => {
    if (!canDeleteOrganization) {
      return toast.error('You do not have the required permissions to delete this organization')
    }
    if (!orgSlug) return console.error('Org slug is required')

    deleteOrganization({ slug: orgSlug })
  }

  return (
    <>
      <div className="mt-2">
        <Button loading={!orgSlug} onClick={() => setIsOpen(true)} type="danger">
          Delete organization
        </Button>
      </div>
      <Modal
        closable
        hideFooter
        size="small"
        visible={isOpen}
        onCancel={() => setIsOpen(false)}
        header={
          <div className="flex items-baseline gap-2">
            <span>Delete organization</span>
            <span className="text-xs text-foreground-lighter">Are you sure?</span>
          </div>
        }
      >
        <Form
          validateOnBlur
          initialValues={{ orgName: '' }}
          onSubmit={onConfirmDelete}
          validate={onValidate}
        >
          {() => (
            <>
              <Modal.Content>
                <p className="text-sm text-foreground-lighter">
                  This action <span className="text-foreground">cannot</span> be undone. This will
                  permanently delete the <span className="text-foreground">{orgName}</span>{' '}
                  organization and remove all of its projects.
                </p>
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <Input
                  id="orgName"
                  label={
                    <span>
                      Please type <span className="font-bold">{orgSlug}</span> to confirm
                    </span>
                  }
                  onChange={(e) => setValue(e.target.value)}
                  value={value}
                  placeholder="Enter the string above"
                  className="w-full"
                />
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <Button
                  block
                  size="small"
                  type="danger"
                  htmlType="submit"
                  loading={isDeleting}
                  disabled={isDeleting}
                >
                  I understand, delete this organization
                </Button>
              </Modal.Content>
            </>
          )}
        </Form>
      </Modal>
    </>
  )
}

export default DeleteOrganizationButton
