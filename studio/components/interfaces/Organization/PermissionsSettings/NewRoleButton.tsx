import * as Tooltip from '@radix-ui/react-tooltip'
import { useEffect, useState } from 'react'
import { useParams } from 'common/hooks'
import { Button, Form, Input, Listbox, Modal } from 'ui'
import { useStore } from 'hooks'
import { Role } from 'types'
import { object, string } from 'yup'
import { useOrganizationRoleCreateMutation } from 'data/organizations/organization-role-create-mutation'
import { isNil } from 'lodash'

export interface NewRoleButtonProps {
  roles: Role[]
}

const NewRoleButton = ({ roles = [] }: NewRoleButtonProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const [isOpen, setIsOpen] = useState(false)

  const canCreateRole = true
  const initialValues = { name: '', description: '', baseRole: undefined }
  const schema = object({
    name: string()
      .required('Role name is required')
      .matches(
        /^[A-Za-z0-9_+=,.@-]+$/,
        'Invalid role name. Role name is an alphanumeric string with no spaces and can contain _+=,.@-'
      ),
    description: string(),
    baseRole: string().required('Base role is required'),
  })
  const { mutateAsync: createRole, isLoading: isCreating } = useOrganizationRoleCreateMutation()
  const eligibleBaseRoles = roles.filter((x) =>
    ['administrator', 'developer', 'none', 'read-only', 'billing-only'].includes(
      x.name.toLowerCase()
    )
  )
  const onCreateRole = async (values: any, { resetForm }: any) => {
    if (!slug) {
      throw new Error('slug is required')
    }

    const existingRole = roles.find((r) => r.name.toLowerCase() === values.name.toLowerCase())
    if (existingRole !== undefined) {
      return ui.setNotification({
        category: 'info',
        message: 'Role name already exists. It is case insensitive.',
      })
    }

    const baseRoleId = Number(values.baseRole)

    try {
      const response = await createRole({
        slug,
        name: values.name,
        description: values.description,
        baseRoleId: baseRoleId,
      })
      if (isNil(response)) {
        ui.setNotification({ category: 'error', message: 'Failed to create role' })
      } else {
        ui.setNotification({ category: 'success', message: 'Successfully created new role.' })
        setIsOpen(!isOpen)
        resetForm({ initialValues: { ...initialValues, baseRole: baseRoleId } })
      }
    } catch (error) {}
  }

  return (
    <>
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Button disabled={!canCreateRole} onClick={() => setIsOpen(true)}>
            New Role
          </Button>
        </Tooltip.Trigger>
        {!canCreateRole && (
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
        header="Create a new role for this organization"
      >
        <Form validationSchema={schema} initialValues={initialValues} onSubmit={onCreateRole}>
          {({ resetForm }: any) => {
            useEffect(() => {
              // Catches 'roles' when its available and then adds a default value for role select
              if (eligibleBaseRoles) {
                resetForm({
                  values: {
                    ...initialValues,
                    baseRole: eligibleBaseRoles[0]?.id,
                  },
                  initialValues: {
                    ...initialValues,
                    baseRole: eligibleBaseRoles[0]?.id,
                  },
                })
              }
            }, [eligibleBaseRoles])

            return (
              <>
                <Modal.Content>
                  <div className="w-full py-4">
                    <div className="space-y-4">
                      <Input autoFocus id="name" placeholder="Enter role name" label="Role name" />

                      <Input
                        id="description"
                        placeholder="Enter role description"
                        label="Role description"
                      />

                      {eligibleBaseRoles && (
                        <Listbox id="baseRole" name="baseRole" label="Base role">
                          {eligibleBaseRoles.map((role: any) => (
                            <Listbox.Option key={role.id} value={role.id} label={role.name}>
                              {role.name}
                            </Listbox.Option>
                          ))}
                        </Listbox>
                      )}
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
                      Create role
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
export default NewRoleButton
