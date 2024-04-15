import { differenceInDays } from 'date-fns'
import React from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import CopyButton from 'components/ui/CopyButton'
import { FormHeader } from 'components/ui/Forms'
import Panel from 'components/ui/Panel'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useS3AccessKeyCreateMutation } from 'data/storage/s3-access-key-create-mutation'
import { useS3AccessKeyDeleteMutation } from 'data/storage/s3-access-key-delete-mutation'
import { useStorageCredentialsQuery } from 'data/storage/s3-access-key-query'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconMoreVertical,
  IconTrash,
  cn,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export const S3Connection = () => {
  const [openCreateCred, setOpenCreateCred] = React.useState(false)
  const [showSuccess, setShowSuccess] = React.useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false)
  const [deleteCredId, setDeleteCredId] = React.useState<string | null>(null)

  const { ref: projectRef } = useParams()
  const { project, isLoading: projectIsLoading } = useProjectContext()

  const { data: storageCreds, ...storageCredsQuery } = useStorageCredentialsQuery({
    projectRef,
  })

  const hasStorageCreds = storageCreds?.data && storageCreds.data.length > 0

  const createS3AccessKey = useS3AccessKeyCreateMutation({
    projectRef,
  })

  const deleteS3AccessKey = useS3AccessKeyDeleteMutation({
    projectRef,
  })

  const { data: projectAPI } = useProjectApiQuery({ projectRef: projectRef })

  function getConnectionURL() {
    const projUrl = projectAPI
      ? `${projectAPI.autoApiService.protocol}://${projectAPI.autoApiService.endpoint}`
      : `https://${projectRef}.supabase.co`

    const url = new URL(projUrl)
    url.pathname = '/storage/v1/s3'
    return url.toString()
  }

  const s3connectionUrl = getConnectionURL()

  return (
    <>
      <div>
        <FormHeader
          title="S3 Connection"
          description="Connect to your bucket via the S3 protocol."
          docsUrl="https://supabase.com/docs/guides/storage/s3/authentication"
        />
        <Panel className="grid gap-4 p-4 !mb-0">
          <FormItemLayout layout="horizontal" label="Endpoint" isReactForm={false}>
            <Input readOnly copy disabled value={s3connectionUrl} />
          </FormItemLayout>
          {projectIsLoading ? (
            <></>
          ) : (
            <FormItemLayout layout="horizontal" label="Region" isReactForm={false}>
              <Input className="input-mono" copy disabled value={project?.region} />
            </FormItemLayout>
          )}
        </Panel>
      </div>

      <div>
        <FormHeader
          title="S3 Credentials"
          description="Manage your S3 credentials for this project."
          actions={
            <Dialog
              open={openCreateCred}
              onOpenChange={(open) => {
                setOpenCreateCred(open)
                if (!open) setShowSuccess(false)
              }}
            >
              <DialogTrigger asChild>
                <Button type="outline">New credential</Button>
              </DialogTrigger>

              <DialogContent
                className="p-4"
                onInteractOutside={(e) => {
                  if (showSuccess) {
                    e.preventDefault()
                  }
                }}
              >
                {showSuccess ? (
                  <>
                    <DialogTitle>Save your new S3 access keys</DialogTitle>
                    <DialogDescription>
                      You won't be able to see them again. If you lose these credentials, you'll
                      need to create a new ones.
                    </DialogDescription>

                    <FormItemLayout label="Access key id" isReactForm={false}>
                      <Input
                        className="input-mono"
                        readOnly
                        copy
                        disabled
                        value={createS3AccessKey.data?.data?.access_key}
                      />
                    </FormItemLayout>
                    <FormItemLayout label={'Secret access key'} isReactForm={false}>
                      <Input
                        className="input-mono"
                        readOnly
                        copy
                        disabled
                        value={createS3AccessKey.data?.data?.secret_key}
                      />
                    </FormItemLayout>
                    <div className="flex justify-end">
                      <Button
                        className="mt-4"
                        onClick={() => {
                          setOpenCreateCred(false)
                          setShowSuccess(false)
                        }}
                      >
                        Done
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <DialogTitle>Create new S3 access keys</DialogTitle>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()

                        const formData = new FormData(e.target as HTMLFormElement)
                        const description = formData.get('description') as string

                        await createS3AccessKey.mutateAsync({ description })
                        setShowSuccess(true)
                      }}
                    >
                      <FormItemLayout label="Description" isReactForm={false}>
                        <Input
                          autoComplete="off"
                          placeholder="My test key"
                          type="text"
                          name="description"
                          required
                        />
                      </FormItemLayout>

                      <div className="flex justify-end">
                        <Button
                          className="mt-4"
                          htmlType="submit"
                          loading={createS3AccessKey.isLoading}
                        >
                          Create credential
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </DialogContent>
            </Dialog>
          }
        />

        <div
          className={cn([
            'bg-surface-100',
            'overflow-hidden border-muted',
            'rounded-md border shadow',
          ])}
        >
          {storageCredsQuery.isLoading ? (
            <div className="p-4">
              <GenericSkeletonLoader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table
                head={[
                  <Table.th key="">Description</Table.th>,
                  <Table.th key="">Access key id</Table.th>,
                  <Table.th key="">Created at</Table.th>,
                  <Table.th key="actions" />,
                ]}
                body={
                  hasStorageCreds ? (
                    storageCreds.data?.map((cred: any) => (
                      <StorageCredItem
                        key={cred.id}
                        created_at={cred.created_at}
                        access_key={cred.access_key}
                        description={cred.description}
                        id={cred.id}
                        onDeleteClick={() => {
                          setDeleteCredId(cred.id)
                          setOpenDeleteDialog(true)
                        }}
                      />
                    ))
                  ) : (
                    <Table.tr>
                      <Table.td colSpan={4}>
                        <p className="text-sm text-foreground">No credentials created</p>
                        <p className="text-sm text-foreground-light">
                          There are no credentials associated with your project yet
                        </p>
                      </Table.td>
                    </Table.tr>
                  )
                }
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="p-4">
          <DialogTitle>Revoke S3 access keys</DialogTitle>
          <DialogDescription>
            This action is irreversible and requests made with these credentials will stop working.
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <Button
              type="outline"
              onClick={() => {
                setOpenDeleteDialog(false)
                setDeleteCredId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="danger"
              loading={deleteS3AccessKey.isLoading}
              onClick={async () => {
                if (!deleteCredId) return
                await deleteS3AccessKey.mutateAsync({ id: deleteCredId })
                setOpenDeleteDialog(false)
                toast.success('S3 access keys revoked')
              }}
            >
              Yes, revoke credentials
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function StorageCredItem({
  description,
  id,
  created_at,
  access_key,
  onDeleteClick,
}: {
  description: string
  id: string
  created_at: string
  access_key: string
  onDeleteClick: (id: string) => void
}) {
  function daysSince(date: string) {
    const now = new Date()
    const created = new Date(date)
    const diffInDays = differenceInDays(now, created)

    if (diffInDays === 0) {
      return 'Today'
    } else if (diffInDays === 1) {
      return `${diffInDays} day ago`
    } else {
      return `${diffInDays} days ago`
    }
  }

  return (
    <tr className="h-8 text-ellipsis group">
      <td>{description}</td>
      <td>
        <div className="flex items-center justify-between">
          <span className="text-ellipsis font-mono cursor-default">{access_key}</span>
          <span className="w-24 text-right opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={access_key} type="outline" />
          </span>
        </div>
      </td>
      <td>{daysSince(created_at)}</td>
      <td>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-end w-full">
            <IconMoreVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-40">
            <DropdownMenuItem
              className="flex gap-1.5 "
              onClick={(e) => {
                e.preventDefault()
                onDeleteClick(id)
              }}
            >
              <IconTrash />
              Revoke credentials
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
