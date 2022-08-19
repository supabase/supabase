import { useState, useContext } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Button, Form, Modal, Input } from '@supabase/ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore, checkPermissions } from 'hooks'
import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { PageContext } from 'pages/org/[slug]/settings'

const DeleteOrganizationButton = observer(() => {
  const PageState: any = useContext(PageContext)
  const router = useRouter()
  const { ui } = useStore()

  const { slug: orgSlug, name: orgName } = PageState.organization

  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState('')

  const canDeleteOrganization = checkPermissions(PermissionAction.UPDATE, 'organizations')

  const onValidate = (values: any) => {
    const errors: any = {}
    if (!values.orgName) {
      errors.orgName = 'Enter the name of the organization.'
    }
    if (values.orgName !== orgSlug) {
      errors.orgName = 'Value entered does not match name of the organization.'
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
      PageState.onOrgDeleted(PageState.organization)
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
        <Button onClick={() => setIsOpen(true)} type="danger">
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
            <h5 className="text-scale-1200 text-sm">Delete organisation</h5>
            <span className="text-scale-900 text-xs">Are you sure?</span>
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
                <p className="text-scale-900 text-sm">
                  This action <span className="text-scale-1200">cannot</span> be undone. This will
                  permanently delete the <span className="text-scale-1200">{orgName}</span>{' '}
                  organization and remove all of its projects.
                </p>
              </Modal.Content>
              <Modal.Seperator />
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
                  placeholder="Type in the orgnaization name"
                  className="w-full"
                />
              </Modal.Content>
              <Modal.Seperator />
              <Modal.Content>
                <Button
                  block
                  danger
                  size="small"
                  type="danger"
                  htmlType="submit"
                  loading={isSubmitting}
                >
                  I understand, delete this organization
                </Button>
              </Modal.Content>
            </div>
          )}
        </Form>
      </Modal>
    </>
  )
})

export default DeleteOrganizationButton
