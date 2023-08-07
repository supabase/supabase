import * as Tooltip from '@radix-ui/react-tooltip'
import { useEffect, useState } from 'react'
import { useParams } from 'common/hooks'
import { Button, Checkbox, Form, Input, Listbox, Modal } from 'ui'
import { useStore } from 'hooks'
import { Role } from 'types'
import { boolean, object, string } from 'yup'
import { isNil } from 'lodash'
import { useOrganizationRolePermissionCreateMutation } from 'data/organizations/organization-role-permission-create-mutation'

export interface NewPermissionsButtonProps {
  roleId: number
}

const NewPermissionsButton = ({ roleId }: NewPermissionsButtonProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const [isOpen, setIsOpen] = useState(false)

  const canCreatePermission = true
  const initialValues = {
    actions: '["read:Read"]',
    resources: '["projects"]',
    condition: '{"and":[{"var":"resource.project_id"}]}',
    restrictive: false,
  }
  // TODO: how to support array + object
  const schema = object({
    actions: string().required('Actions is required'),
    resources: string().required('Resources is required'),
    condition: string(),
    restrictive: boolean(),
  })
  const { mutateAsync: createPermission, isLoading: isCreating } =
    useOrganizationRolePermissionCreateMutation()

  const onCreatePermission = async (values: any, { resetForm }: any) => {
    console.log('onCreatePermission onCreatePermission onCreatePermission')
    if (!slug) {
      throw new Error('slug is required')
    }

    try {
      const response = await createPermission({
        slug,
        roleId,
        actions: JSON.parse(values.actions),
        resources: JSON.parse(values.resources),
        condition: JSON.parse(values.condition),
        restrictive: values.restrictive,
      })
      if (isNil(response)) {
        ui.setNotification({ category: 'error', message: 'Failed to create role permission' })
      } else {
        ui.setNotification({
          category: 'success',
          message: 'Successfully created new role permission.',
        })
        setIsOpen(!isOpen)
        resetForm({ initialValues: { ...initialValues } })
      }
    } catch (error) {}
  }

  return (
    <>
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Button disabled={!canCreatePermission} onClick={() => setIsOpen(true)}>
            New Permission
          </Button>
        </Tooltip.Trigger>
        {!canCreatePermission && (
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                  'border border-scale-200',
                ].join(' ')}
              >
                <span className="text-xs text-scale-1200">
                  You need additional permissions to create new role for this organization
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
      <Modal
        hideFooter
        size="medium"
        layout="vertical"
        className="!overflow-visible"
        visible={isOpen}
        onCancel={() => setIsOpen(false)}
        header="Create a new permission for this role"
      >
        <Form validationSchema={schema} initialValues={initialValues} onSubmit={onCreatePermission}>
          {({ resetForm }: any) => {
            return (
              <>
                <Modal.Content>
                  <div className="w-full py-4">
                    <div className="space-y-4">
                      <Input autoFocus id="actions" label="Actions" />
                      <Input id="resources" label="Resources" />
                      <Checkbox
                        id="restrictive"
                        label="Restrictive permission"
                        description="Proin enim tortor, consequat et erat vitae, pretium fermentum leo. Curabitur sit amet dolor egestas, eleifend nunc et, sagittis sapien."
                      />
                      <Input id="condition" label="Condition" />
                    </div>
                  </div>
                </Modal.Content>
                <Modal.Separator />
                <Modal.Content>
                  <div className="pt-2 pb-3">
                    <Button
                      block
                      size="medium"
                      htmlType="submit"
                      disabled={isCreating}
                      loading={isCreating}
                    >
                      Create permission
                    </Button>
                  </div>
                </Modal.Content>
              </>
            )
          }}
        </Form>
      </Modal>
    </>
  )
}
export default NewPermissionsButton
