import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertTitle } from '@ui/components/shadcn/ui/alert'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { useIsProjectActive } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useProjectStorageConfigUpdateUpdateMutation } from 'data/config/project-storage-config-update-mutation'
import { useStorageCredentialsQuery } from 'data/storage/s3-access-key-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import {
  AlertDescription_Shadcn_,
  Alert_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
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
  const { data: project, isLoading: projectIsLoading } = useSelectedProjectQuery()

  const [openCreateCred, setOpenCreateCred] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deleteCred, setDeleteCred] = useState<{ id: string; description: string }>()

  const { can: canReadS3Credentials, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_READ,
    '*'
  )
  const { can: canUpdateStorageSettings } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_WRITE,
    '*'
  )

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
      <ScaffoldSection isFullWidth>
        <div className="flex items-center justify-between mb-6">
          <div>
            <ScaffoldSectionTitle>Connection</ScaffoldSectionTitle>
            <ScaffoldSectionDescription>
              Connect to your bucket using any S3-compatible service via the S3 protocol.
            </ScaffoldSectionDescription>
          </div>
          <DocsButton href={`${DOCS_URL}/guides/storage/s3/authentication`} />
        </div>

        {isErrorStorageConfig && (
          <AlertError
            className="mb-4"
            subject="Failed to retrieve storage configuration"
            error={configError}
          />
        )}

        <Form_Shadcn_ {...form}>
          <form id="s3-connection-form" onSubmit={form.handleSubmit(onSubmit)}>
            {projectIsLoading ? (
              <GenericSkeletonLoader />
            ) : isProjectActive ? (
              <Card>
                <CardContent className="pt-6">
                  <FormField_Shadcn_
                    name="s3ConnectionEnabled"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout
                        layout="horizontal"
                        className="[&>*>label]:text-foreground"
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
                </CardContent>

                <CardContent className="py-6">
                  <div className="flex flex-col gap-y-4">
                    <FormItemLayout layout="horizontal" label="Endpoint" isReactForm={false}>
                      <Input readOnly copy disabled value={s3connectionUrl} />
                    </FormItemLayout>
                    {!projectIsLoading && (
                      <FormItemLayout layout="horizontal" label="Region" isReactForm={false}>
                        <Input className="input-mono" copy disabled value={project?.region} />
                      </FormItemLayout>
                    )}
                  </div>
                </CardContent>

                {!isLoadingPermissions && !canUpdateStorageSettings && (
                  <CardContent>
                    <p className="text-sm text-foreground-light">
                      You need additional permissions to update storage settings
                    </p>
                  </CardContent>
                )}

                <CardFooter className="justify-end space-x-2">
                  {form.formState.isDirty && (
                    <Button
                      type="default"
                      htmlType="reset"
                      onClick={() => form.reset()}
                      disabled={!form.formState.isDirty || !canUpdateStorageSettings || isUpdating}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdating}
                    disabled={!form.formState.isDirty || !canUpdateStorageSettings || isUpdating}
                  >
                    Save
                  </Button>
                </CardFooter>
              </Card>
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
      </ScaffoldSection>

      <ScaffoldSection isFullWidth>
        <div className="flex items-center justify-between mb-6">
          <div>
            <ScaffoldSectionTitle>Access keys</ScaffoldSectionTitle>
            <ScaffoldSectionDescription>
              Manage your access keys for this project.
            </ScaffoldSectionDescription>
          </div>
          <CreateCredentialModal visible={openCreateCred} onOpenChange={setOpenCreateCred} />
        </div>

        {projectIsLoading || isLoadingPermissions ? (
          <GenericSkeletonLoader />
        ) : !canReadS3Credentials ? (
          <NoPermission resourceText="view this project's S3 access keys" />
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
      </ScaffoldSection>

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
