import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertTitle } from '@ui/components/shadcn/ui/alert'
import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useProjectStorageConfigUpdateUpdateMutation } from 'data/config/project-storage-config-update-mutation'
import { useStorageCredentialsQuery } from 'data/storage/s3-access-key-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsProjectActive, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WarningIcon,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { CreateCredentialModal } from './CreateCredentialModal'
import { RevokeCredentialModal } from './RevokeCredentialModal'
import { StorageCredItem } from './StorageCredItem'
import { getConnectionURL } from './StorageSettings.utils'

export const S3Connection = () => {
  const { ref: projectRef } = useParams()
  const isProjectActive = useIsProjectActive()
  const { data: project, isPending: projectIsLoading } = useSelectedProjectQuery()

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
  const { data: storageCreds, isPending: isLoadingStorageCreds } = useStorageCredentialsQuery(
    { projectRef },
    { enabled: canReadS3Credentials }
  )

  const { mutate: updateStorageConfig, isPending: isUpdating } =
    useProjectStorageConfigUpdateUpdateMutation({
      onSuccess: (_, vars) => {
        if (vars.features?.s3Protocol) {
          form.reset({ s3ConnectionEnabled: vars.features.s3Protocol.enabled })
        }
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
      <PageContainer>
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Connection</PageSectionTitle>
              <PageSectionDescription>
                Connect to your bucket using any S3-compatible service via the S3 protocol
              </PageSectionDescription>
            </PageSectionSummary>
            <PageSectionAside>
              <DocsButton href={`${DOCS_URL}/guides/storage/s3/authentication`} />
            </PageSectionAside>
          </PageSectionMeta>

          <PageSectionContent>
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
                    <CardContent>
                      <FormField_Shadcn_
                        name="s3ConnectionEnabled"
                        control={form.control}
                        render={({ field }) => (
                          <FormItemLayout
                            layout="flex-row-reverse"
                            className="[&>*>label]:text-foreground"
                            label="S3 protocol connection"
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

                    <CardContent>
                      <FormItemLayout
                        layout="flex-row-reverse"
                        className="[&>div]:md:w-1/2 [&>div>div]:w-full [&>div]:min-w-100"
                        label="Endpoint"
                        isReactForm={false}
                      >
                        <Input readOnly copy value={s3connectionUrl} />
                      </FormItemLayout>
                    </CardContent>

                    <CardContent>
                      <FormItemLayout
                        layout="flex-row-reverse"
                        className="[&>div]:md:w-1/2 [&>div>div]:w-full [&>div]:min-w-100"
                        label="Region"
                        isReactForm={false}
                      >
                        <Input
                          readOnly
                          copy
                          value={project?.region}
                          data-1p-ignore
                          data-lpignore="true"
                          data-form-type="other"
                          data-bwignore
                        />
                      </FormItemLayout>
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
                          disabled={
                            !form.formState.isDirty || !canUpdateStorageSettings || isUpdating
                          }
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isUpdating}
                        disabled={
                          !form.formState.isDirty || !canUpdateStorageSettings || isUpdating
                        }
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
          </PageSectionContent>
        </PageSection>

        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Access keys</PageSectionTitle>
              <PageSectionDescription>
                Manage your access keys for this project
              </PageSectionDescription>
            </PageSectionSummary>
            <PageSectionAside>
              <CreateCredentialModal visible={openCreateCred} onOpenChange={setOpenCreateCred} />
            </PageSectionAside>
          </PageSectionMeta>

          <PageSectionContent>
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
                  <GenericSkeletonLoader />
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead key="description">Name</TableHead>
                          <TableHead key="access-key-id">Key ID</TableHead>
                          <TableHead key="created-at">Created at</TableHead>
                          <TableHead key="actions" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hasStorageCreds ? (
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
                          <TableRow>
                            <TableCell colSpan={4} className="!rounded-b-md overflow-hidden">
                              <p className="text-sm text-foreground">No access keys created</p>
                              <p className="text-sm text-foreground-light">
                                There are no access keys associated with your project yet
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </>
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>

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
