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
import { checkPermissions, useStore } from 'hooks'
import { PostgresExtension } from '@supabase/postgres-meta'

interface Props {}

const VaultToggle: FC<Props> = () => {
  const { meta, ui } = useStore()
  const formId = 'project-vault-settings'
  const canToggleVault = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'extensions')

  const [vaultExtension] = meta.extensions.list(
    (ext: PostgresExtension) => ext.name.toLowerCase() === 'supabase_vault'
  )

  // [Joshen TODO] Need to put this logic correctly once i can toggle vault extension
  const isEnabled = vaultExtension?.installed_version !== null
  const initialValues = { enabled: true }

  const onSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    if (vaultExtension === undefined) return

    setSubmitting(true)
    if (values.enabled) {
      // Enable Vault
      const { error: createSchemaError } = await meta.query(
        `create schema if not exists ${vaultExtension.schema}`
      )
      if (createSchemaError) {
        return ui.setNotification({
          error: createSchemaError,
          category: 'error',
          message: `Failed to create schema: ${createSchemaError.message}`,
        })
      }
      const { error: createExtensionError } = await meta.extensions.create({
        schema: vaultExtension.schema,
        name: vaultExtension.name,
        version: vaultExtension.default_version,
        cascade: true,
      })
      if (createExtensionError) {
        ui.setNotification({
          error: createExtensionError,
          category: 'error',
          message: `Failed to enable Vault for your project: ${createExtensionError.message}`,
        })
      } else {
        ui.setNotification({
          category: 'success',
          message: 'Vault is not enabled for your project',
        })
      }
    } else {
      // Disable Vault
      const response: any = await meta.extensions.del(vaultExtension.name)
      if (response.error) {
        ui.setNotification({
          category: 'error',
          message: `Failed to disable Vault: ${response.error.message}`,
        })
      } else {
        ui.setNotification({
          category: 'success',
          message: 'Vault is not disabled for your project',
        })
      }
    }
    setSubmitting(false)
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
