import Link from 'next/link'
import { FC } from 'react'
import { useRouter } from 'next/router'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, Form, Input, IconArrowLeft, IconExternalLink, Toggle, IconHelpCircle } from 'ui'

import { useParams, useStore } from 'hooks'
import {
  FormActions,
  FormPanel,
  FormsContainer,
  FormSection,
  FormSectionLabel,
  FormSectionContent,
} from 'components/ui/Forms'
import { ROLE_PERMISSIONS } from './Roles.constants'

interface Props {}

// [Joshen] There are a lot of other parameters that pg/pg-meta supports for creating a role
// but these are just the minimal parameters for now
// https://github.com/supabase/postgres-meta/blob/3b4c3a0ea052389599cf5e2900f7185870d6f60c/src/lib/types.ts#L224

const CreateRole: FC<Props> = ({}) => {
  const router = useRouter()
  const { ref } = useParams()
  const { ui, meta } = useStore()

  const formId = 'create-new-role'
  const initialValues = {
    name: '',
    is_superuser: false,
    can_login: false,
    can_create_role: false,
    can_create_db: false,
    is_replication_role: false,
    can_bypass_rls: false,
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)
    const res = await meta.roles.create(values)
    if (res.error) {
      setSubmitting(false)
      return ui.setNotification({
        category: 'error',
        message: `Failed to create role: ${res.error.message}`,
      })
    } else {
      ui.setNotification({
        category: 'success',
        message: `Successfully created new role: ${res.name}`,
      })
      router.push(`/project/${ref}/database/roles`)
    }
  }

  return (
    <FormsContainer>
      <div>
        <div className="relative flex items-center justify-between mb-6">
          <div
            className={[
              'transition cursor-pointer',
              'absolute -left-20 top-1 opacity-75 hover:opacity-100',
            ].join(' ')}
          >
            <Link href={`/project/${ref}/database/roles`}>
              <a>
                <div className="flex items-center space-x-2">
                  <IconArrowLeft strokeWidth={1.5} size={14} />
                  <p className="text-sm">Back</p>
                </div>
              </a>
            </Link>
          </div>
          <h3 className="mb-2 text-xl text-scale-1200">Create a new role</h3>
          {/* <div className="flex items-center space-x-2">
            <Link href="https://supabase.github.io/wrappers/stripe/">
              <a target="_blank">
                <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                  Documentation
                </Button>
              </a>
            </Link>
          </div> */}
        </div>

        <Form id={formId} initialValues={initialValues} onSubmit={onSubmit}>
          {({ isSubmitting, handleReset, values, initialValues }: any) => {
            const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)
            return (
              <FormPanel
                disabled={false}
                footer={
                  <div className="flex px-8 py-4">
                    <FormActions
                      form={formId}
                      isSubmitting={isSubmitting}
                      hasChanges={hasChanges}
                      handleReset={handleReset}
                      helper={
                        !true
                          ? 'You need additional permissions to create a database role'
                          : undefined
                      }
                    />
                  </div>
                }
              >
                <FormSection header={<FormSectionLabel>Role Configuration</FormSectionLabel>}>
                  <FormSectionContent loading={false}>
                    <Input id="name" label="Name" />
                  </FormSectionContent>
                </FormSection>
                <FormSection header={<FormSectionLabel>Role Privileges</FormSectionLabel>}>
                  <FormSectionContent loading={false}>
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
                                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                      'border border-scale-200 space-y-1',
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
              </FormPanel>
            )
          }}
        </Form>
      </div>
    </FormsContainer>
  )
}

export default CreateRole
