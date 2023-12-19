import * as Tooltip from '@radix-ui/react-tooltip'
import { useRef } from 'react'
import toast from 'react-hot-toast'
import { Button, Form, IconHelpCircle, Input, SidePanel, Toggle } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms'
import { useDatabaseRoleCreateMutation } from 'data/database-roles/database-role-create-mutation'
import { ROLE_PERMISSIONS } from './Roles.constants'

interface CreateRolePanelProps {
  visible: boolean
  onClose: () => void
}

const CreateRolePanel = ({ visible, onClose }: CreateRolePanelProps) => {
  const formId = 'create-new-role'
  const submitRef: any = useRef()
  const { project } = useProjectContext()

  const initialValues = {
    name: '',
    is_superuser: false,
    can_login: false,
    can_create_role: false,
    can_create_db: false,
    is_replication_role: false,
    can_bypass_rls: false,
  }

  const validate = (values: any) => {
    const errors: any = {}
    if (values.name.length === 0) errors.name = 'Please provide a name for your role'
    return errors
  }

  const { mutate: createDatabaseRole, isLoading: isCreating } = useDatabaseRoleCreateMutation({
    onSuccess: (res) => {
      toast.success(`Successfully created new role: ${res.name}`)
      onClose()
    },
  })

  const onSubmit = async (values: any) => {
    if (!project) return console.error('Project is required')
    createDatabaseRole({
      projectRef: project.ref,
      connectionString: project.connectionString,
      payload: values,
    })
  }

  return (
    <SidePanel
      size="large"
      visible={visible}
      header="Create a new role"
      className="mr-0 transform transition-all duration-300 ease-in-out"
      loading={false}
      onCancel={onClose}
      customFooter={
        <div className="flex w-full justify-end space-x-3 border-t border-default px-3 py-4">
          <Button
            size="tiny"
            type="default"
            htmlType="button"
            onClick={onClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            size="tiny"
            type="primary"
            htmlType="button"
            disabled={isCreating}
            loading={isCreating}
            onClick={() => submitRef?.current?.click()}
          >
            Create role
          </Button>
        </div>
      }
    >
      <Form
        validateOnBlur
        id={formId}
        initialValues={initialValues}
        validate={validate}
        onSubmit={onSubmit}
      >
        <div>
          <FormSection
            header={
              <FormSectionLabel className="lg:!col-span-4">Role Configuration</FormSectionLabel>
            }
          >
            <FormSectionContent loading={false} className="lg:!col-span-8">
              <Input id="name" label="Name" />
            </FormSectionContent>
          </FormSection>
          <SidePanel.Separator />
          <FormSection
            header={<FormSectionLabel className="lg:!col-span-4">Role Privileges</FormSectionLabel>}
          >
            <FormSectionContent loading={false} className="lg:!col-span-8">
              <div className="space-y-[9px]">
                {Object.keys(ROLE_PERMISSIONS).map((permission) => (
                  <Toggle
                    size="small"
                    disabled={ROLE_PERMISSIONS[permission].disabled}
                    className={[
                      'roles-toggle',
                      ROLE_PERMISSIONS[permission].disabled ? 'opacity-50' : '',
                    ].join(' ')}
                    key={permission}
                    id={permission}
                    name={permission}
                    label={ROLE_PERMISSIONS[permission].description}
                    afterLabel={
                      ROLE_PERMISSIONS[permission].disabled && (
                        <Tooltip.Root delayDuration={0}>
                          <Tooltip.Trigger type="button">
                            <IconHelpCircle
                              size="tiny"
                              strokeWidth={2}
                              className="ml-2 relative top-[3px]"
                            />
                          </Tooltip.Trigger>
                          <Tooltip.Content align="center" side="bottom">
                            <Tooltip.Arrow className="radix-tooltip-arrow" />
                            <div
                              className={[
                                'rounded bg-alternative py-1 px-2 leading-none shadow',
                                'border border-background space-y-1',
                              ].join(' ')}
                            >
                              <span className="text-xs">
                                This privilege cannot be granted via the dashboard
                              </span>
                            </div>
                          </Tooltip.Content>
                        </Tooltip.Root>
                      )
                    }
                  />
                ))}
              </div>
            </FormSectionContent>
          </FormSection>
          <button ref={submitRef} type="submit" className="hidden" />
        </div>
      </Form>
    </SidePanel>
  )
}

export default CreateRolePanel
