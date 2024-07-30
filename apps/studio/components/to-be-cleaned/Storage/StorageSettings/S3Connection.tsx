import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertTitle } from '@ui/components/shadcn/ui/alert'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import {
  useIsProjectActive,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import Panel from 'components/ui/Panel'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useStorageCredentialsQuery } from 'data/storage/s3-access-key-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { AlertDescription_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { WarningIcon } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
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

  const canReadS3Credentials = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  const { data: projectAPI } = useProjectApiQuery({ projectRef: projectRef })
  const { data: storageCreds, ...storageCredsQuery } = useStorageCredentialsQuery(
    { projectRef },
    { enabled: canReadS3Credentials }
  )

  const hasStorageCreds = storageCreds?.data && storageCreds.data.length > 0
  const s3connectionUrl = getConnectionURL(projectRef ?? '', projectAPI)

  return (
    <>
      <div>
        <FormHeader
          title="S3 Connection"
          description="Connect to your bucket via the S3 protocol."
          docsUrl="https://supabase.com/docs/guides/storage/s3/authentication"
        />
        {projectIsLoading ? (
          <GenericSkeletonLoader />
        ) : isProjectActive ? (
          <Panel className="grid gap-4 p-4 !mb-0">
            <FormItemLayout layout="horizontal" label="Endpoint" isReactForm={false}>
              <Input readOnly copy disabled value={s3connectionUrl} />
            </FormItemLayout>
            {!projectIsLoading && (
              <FormItemLayout layout="horizontal" label="Region" isReactForm={false}>
                <Input className="input-mono" copy disabled value={project?.region} />
              </FormItemLayout>
            )}
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
      </div>

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
            {storageCredsQuery.isLoading ? (
              <div className="p-4">
                <GenericSkeletonLoader />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table
                  head={[
                    <Table.th key="">Description</Table.th>,
                    <Table.th key="">Access key ID</Table.th>,
                    <Table.th key="">Created at</Table.th>,
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
