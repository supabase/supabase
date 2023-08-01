import * as Tooltip from '@radix-ui/react-tooltip'
import { useEffect, useState } from 'react'
import { useParams } from 'common/hooks'
import { Button, Form, IconMail, Input, Listbox, Modal } from 'ui'
import { useStore } from 'hooks'
import { Role } from 'types'
import { number, object, string } from 'yup'

export interface NewRoleButtonProps {
  parentRoles: Role[]
}

const NewRoleButton = ({ parentRoles = [] }: NewRoleButtonProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const [isOpen, setIsOpen] = useState(false)

  const canCreateRole = true
  const initialValues = { name: '', description: '', parent_role: undefined }
  const schema = object({
    name: string().required('Name is required'),
    description: string(),
    parent_role: number(),
  })
  const onCreateRole = async (values: any, { resetForm }: any) => {}

  return (
    <>
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Button disabled={!canCreateRole} onClick={() => setIsOpen(true)}>
            Invite
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
        header="Invite a member to this organization"
      >
        <Form validationSchema={schema} initialValues={initialValues} onSubmit={onCreateRole}>
          {({ values, resetForm }: any) => {
            // const selectedRole = roles.find((role) => role.id === Number(values.role))
            // const invalidRoleSelected = values.role && !rolesAddable.includes(Number(values.role))

            return (
              <>
                <Modal.Content>
                  <div className="w-full py-4">
                    <div className="space-y-4">
                      <Input
                        autoFocus
                        id="name"
                        icon={<IconMail />}
                        placeholder="Enter role name"
                        label="Role name"
                      />

                      <Input
                        autoFocus
                        id="email"
                        icon={<IconMail />}
                        placeholder="Enter role description"
                        label="Role description"
                      />

                      {parentRoles && (
                        <Listbox id="parent_role" name="parent_role" label="Parent role">
                          {parentRoles.map((role: any) => (
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
                      // disabled={isInviting || invalidRoleSelected}
                      // loading={isInviting}
                    >
                      Invite new member
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
