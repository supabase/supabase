import { FC } from 'react'
import { Form, Button, Toggle, IconExternalLink, Alert, IconHelpCircle, IconAlertCircle } from 'ui'

import {
  FormHeader,
  FormPanel,
  FormActions,
  FormSection,
  FormSectionContent,
} from 'components/ui/Forms'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { checkPermissions } from 'hooks'
import InformationBox from 'components/ui/InformationBox'

interface Props {}

const Vault: FC<Props> = () => {
  const formId = 'project-vault-settings'
  const canToggleVault = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'extensions')

  const initialValues = { enabled: true }

  const onSubmit = async (values: any, { setSubmitting, resetForm }: any) => {}

  return (
    <Form id={formId} initialValues={initialValues} onSubmit={onSubmit}>
      {({ isSubmitting, handleReset, values, initialValues }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)
        return (
          <>
            <FormHeader
              title="Vault"
              description="Enable application level encryption for your project"
            />

            <FormPanel
              disabled={!canToggleVault}
              footer={
                <div className="flex py-4 px-8">
                  <Button type="default" icon={<IconExternalLink />}>
                    What is Supabase Vault?
                  </Button>
                  <FormActions
                    form={formId}
                    isSubmitting={isSubmitting}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
                    helper={
                      !canToggleVault
                        ? 'You need additional permissions to toggle Vault for this project'
                        : undefined
                    }
                  />
                </div>
              }
            >
              <FormSection>
                <FormSectionContent fullWidth loading={false}>
                  <Toggle
                    id="enabled"
                    size="small"
                    layout="flex"
                    label="Enable Supabase Vault"
                    descriptionText="Vault provides secret management and data encryption for your project"
                    disabled={!canToggleVault}
                  />
                  {hasChanges && (
                    <>
                      {values.enabled ? (
                        <InformationBox
                          defaultVisibility
                          hideCollapse
                          icon={<IconAlertCircle strokeWidth={2} />}
                          title="Enabling Vault for your project"
                          description={
                            <div>
                              <p className="text-sm">
                                A new schema <code>vault</code> will be created in your database,
                                where you will be able to manage your secrets.
                              </p>
                            </div>
                          }
                        />
                      ) : (
                        <Alert withIcon variant="warning" title="Disabling Vault for your project">
                          The schema <code>vault</code> will be removed from your database and
                          [highlight other side effects]
                        </Alert>
                      )}
                    </>
                  )}
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
}

export default Vault
