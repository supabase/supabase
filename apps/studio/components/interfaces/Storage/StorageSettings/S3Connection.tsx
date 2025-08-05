import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertTitle } from '@ui/components/shadcn/ui/alert'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import {
  useIsProjectActive,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import Panel from 'components/ui/Panel'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useProjectStorageConfigUpdateUpdateMutation } from 'data/config/project-storage-config-update-mutation'
import { useStorageCredentialsQuery } from 'data/storage/s3-access-key-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  AlertDescription_Shadcn_,
  Alert_Shadcn_,
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Separator,
  Switch,
  WarningIcon,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { CreateCredentialModal } from './CreateCredentialModal'
import { RevokeCredentialModal } from './RevokeCredentialModal'
import { StorageCredItem } from './StorageCredItem'
import { getConnectionURL } from './StorageSettings.utils'

export const S3Connection = () => {
  const { ref: projectRef } = useParams()
  const isProjectActive = useIsProjectActive()
  const { project, isLoading: projectIsLoading } = useProjectContext()

  const [openCreateCred, setOpenCreateCred] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deleteCred, setDeleteCred] = useState<{ id: string; description: string }>()

  const canReadS3Credentials = useCheckPermissions(PermissionAction.STORAGE_ADMIN_READ, '*')
  const canUpdateStorageSettings = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const {
    data: config,
    error: configError,
    isSuccess: isSuccessStorageConfig,
    isError: isErrorStorageConfig,
  } = useProjectStorageConfigQuery({ projectRef })
  const { data: storageCreds, isLoading: isLoadingStorageCreds } = useStorageCredentialsQuery(
    { projectRef },
    { enabled: canReadS3Credentials }
  )

  const { mutate: updateStorageConfig, isLoading: isUpdating } =
    useProjectStorageConfigUpdateUpdateMutation({
      onSuccess: (_, vars) => {
        if (vars.features) form.reset({ s3ConnectionEnabled: vars.features.s3Protocol.enabled })
        toast.success('Successfully updated storage settings')
      },
    })

  const FormSchema = z.object({ s3ConnectionEnabled: z.boolean() })
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { s3ConnectionEnabled: false },
  })

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.storage_endpoint || settings?.app_config?.endpoint
  const hasStorageCreds = storageCreds?.data && storageCreds.data.length > 0
  const s3connectionUrl = getConnectionURL(projectRef ?? '', protocol, endpoint)

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!config) return console.error('Storage config is required')
    updateStorageConfig({
      projectRef,
      features: {
        ...config?.features,
        s3Protocol: { enabled: data.s3ConnectionEnabled },
      },
    })
  }

  useEffect(() => {
    form.reset({ s3ConnectionEnabled: config?.features.s3Protocol.enabled })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessStorageConfig])

  return (
    <>
      <Form_Shadcn_ {...form}>
        <form id="s3-connection-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FormHeader
            title="S3 Connection"
            description="Connect to your bucket using any S3-compatible service via the S3 protocol"
            docsUrl="https://supabase.com/docs/guides/storage/s3/authentication"
          />
          {projectIsLoading ? (
            <GenericSkeletonLoader />
          ) : isProjectActive ? (
            <Panel className="!mb-0">
              <FormField_Shadcn_
                name="s3ConnectionEnabled"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    className="px-8 py-8 [&>*>label]:text-foreground"
                    label="Enable connection via S3 protocol"
                    description="Allow clients to connect to Supabase Storage via the S3 protocol"
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        size="large"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isSuccessStorageConfig || field.disabled}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              {isErrorStorageConfig && (
                <div className="px-8 pb-8">
                  <AlertError
                    subject="Failed to retrieve storage configuration"
                    error={configError}
                  />
                </div>
              )}

              <Separator className="bg-border" />

              <div className="flex flex-col gap-y-4 py-8">
                <FormItemLayout
                  layout="horizontal"
                  className="px-8"
                  label="Endpoint"
                  isReactForm={false}
                >
                  <Input readOnly copy disabled value={s3connectionUrl} />
                </FormItemLayout>
                {!projectIsLoading && (
                  <FormItemLayout
                    layout="horizontal"
                    className="px-8"
                    label="Region"
                    isReactForm={false}
                  >
                    <Input className="input-mono" copy disabled value={project?.region} />
                  </FormItemLayout>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between w-full gap-2 px-8 py-4">
                {!canUpdateStorageSettings ? (
                  <p className="text-sm text-foreground-light">
                    You need additional permissions to update storage settings
                  </p>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <Button
                    type="default"
                    htmlType="reset"
                    onClick={() => form.reset()}
                    disabled={!form.formState.isDirty || !canUpdateStorageSettings || isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdating}
                    disabled={!form.formState.isDirty || !canUpdateStorageSettings || isUpdating}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </Panel>
          ) : (
            <Alert_Shadcn_ variant="warning">
              <WarningIcon />
              <AlertTitle>Project is paused</AlertTitle>
              <AlertDescription_Shadcn_>
                To connect to your S3 bucket, you need to restore your project.
              </AlertDescription_Shadcn_>
              <div className="mt-3 flex items-center space-x-2">
                <Button asChild type="default">
                  <Link href={`/project/${projectRef}`}>Restore project</Link>
                </Button>
              </div>
            </Alert_Shadcn_>
          )}
        </form>
      </Form_Shadcn_>

      <div>
        <FormHeader
          title="S3 Access Keys"
          description="Manage your access keys for this project."
          actions={
            <CreateCredentialModal visible={openCreateCred} onOpenChange={setOpenCreateCred} />
          }
        />

        {!canReadS3Credentials ? (
          <NoPermission resourceText="view this project's S3 access keys" />
        ) : projectIsLoading ? (
          <GenericSkeletonLoader />
        ) : !isProjectActive ? (
          <Alert_Shadcn_ variant="warning">
            <WarningIcon />
            <AlertTitle>Can't fetch S3 access keys</AlertTitle>
            <AlertDescription_Shadcn_>
              To fetch your S3 access keys, you need to restore your project.
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_>
              <Button asChild type="default" className="mt-3">
                <Link href={`/project/${projectRef}`}>Restore project</Link>
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : (
          <>
            {isLoadingStorageCreds ? (
              <div className="p-4">
                <GenericSkeletonLoader />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table
                  head={[
                    <Table.th key="description">Description</Table.th>,
                    <Table.th key="access-key-id">Access key ID</Table.th>,
                    <Table.th key="created-at">Created at</Table.th>,
                    <Table.th key="actions" />,
                  ]}
                  body={
                    hasStorageCreds ? (
                      storageCreds.data?.map((cred) => (
                        <StorageCredItem
                          key={cred.id}
                          created_at={cred.created_at}
                          access_key={cred.access_key}
                          description={cred.description}
                          id={cred.id}
                          onDeleteClick={() => {
                            setDeleteCred(cred)
                            setOpenDeleteDialog(true)
                          }}
                        />
                      ))
                    ) : (
                      <Table.tr>
                        <Table.td colSpan={4} className="!rounded-b-md overflow-hidden">
                          <p className="text-sm text-foreground">No access keys created</p>
                          <p className="text-sm text-foreground-light">
                            There are no access keys associated with your project yet
                          </p>
                        </Table.td>
                      </Table.tr>
                    )
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      <RevokeCredentialModal
        visible={openDeleteDialog}
        selectedCredential={deleteCred}
        onClose={() => {
          setOpenDeleteDialog(false)
          setDeleteCred(undefined)
        }}
      />
    </>
  )
}
