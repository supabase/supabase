import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Button, Form, Input, Modal } from 'ui'

import { invalidateOrganizationsQuery } from 'data/organizations/organizations-query'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

const DeleteOrganizationButton = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { ui } = useStore()

  const selectedOrganization = useSelectedOrganization()
  const { slug: orgSlug, name: orgName } = selectedOrganization ?? {}

  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState('')

  const canDeleteOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')

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

  const onConfirmDelete = async (values: any, { setSubmitting }: any) => {
    if (!canDeleteOrganization) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to delete this organization',
      })
    }

    setSubmitting(true)
    const response = await delete_(`${API_URL}/organizations/${orgSlug}`)
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete organization: ${response.error.message}`,
      })
      setSubmitting(false)
    } else {
      invalidateOrganizationsQuery(queryClient)
      setSubmitting(false)
      router.push('/')
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted ${orgName}`,
      })
    }
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
            <h5 className="text-sm text-scale-1200">Delete organisation</h5>
            <span className="text-xs text-scale-900">Are you sure?</span>
          </div>
        }
      >
        <Form
          validateOnBlur
          initialValues={{ orgName: '' }}
          onSubmit={onConfirmDelete}
          validate={onValidate}
        >
          {({ isSubmitting }: { isSubmitting: boolean }) => (
            <div className="space-y-4 py-3">
              <Modal.Content>
                <p className="text-sm text-scale-900">
                  This action <span className="text-scale-1200">cannot</span> be undone. This will
                  permanently delete the <span className="text-scale-1200">{orgName}</span>{' '}
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
                <Button block size="small" type="danger" htmlType="submit" loading={isSubmitting}>
                  I understand, delete this organization
                </Button>
              </Modal.Content>
            </div>
          )}
        </Form>
      </Modal>
    </>
  )
}

export default DeleteOrganizationButton
