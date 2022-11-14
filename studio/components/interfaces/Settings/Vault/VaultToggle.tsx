import Link from 'next/link'
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

interface Props {}

const VaultToggle: FC<Props> = () => {
  const formId = 'project-vault-settings'
  const canToggleVault = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'extensions')

  const initialValues = { enabled: true }

  const onSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    console.log('onSubmit', values)
  }

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
                  <Link href="https://supabase.com/docs">
                    <a target="_blank">
                      <Button type="default" icon={<IconExternalLink />}>
                        What is Supabase Vault?
                      </Button>
                    </a>
                  </Link>
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
                    label="Enable Vault"
                    descriptionText="Vault provides secret management and data encryption for your project"
                    disabled={!canToggleVault}
                  />
                  {hasChanges && !values.enabled && (
                    <Alert
                      withIcon
                      variant="warning"
                      title="Warning: Disabling Vault for your project"
                    >
                      All of your current secrets that are stored in the Vault will be removed from
                      and cannot be recovered. If you have tables which are currently using any
                      secrets, you may not be able to decrypt them. This action cannot be undone.
                    </Alert>
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

export default VaultToggle
