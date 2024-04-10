import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms'
import { useStorageCredentialsCreateMutation } from 'data/storage/storage-credentials-create-mutation'
import { useStorageCredentialsQuery } from 'data/storage/storage-credentials-query'
import React from 'react'
import toast from 'react-hot-toast'
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
  Input,
  Label_Shadcn_,
  cn,
} from 'ui'
import Table from 'components/to-be-cleaned/Table'
import Panel from 'components/ui/Panel'
import { useStorageCredentialsDeleteMutation } from 'data/storage/storage-credentials-delete-mutation'

type Props = {}

export const S3Connection = (props: Props) => {
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

  const createStorageCreds = useStorageCredentialsCreateMutation({
    projectRef,
  })

  const deleteStorageCreds = useStorageCredentialsDeleteMutation({
    projectRef,
  })

  function getConnectionURL() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_SITE_URL is required')
    }
    const url = new URL(baseUrl)
    url.hostname = `${projectRef}.${url.hostname}`
    url.pathname = '/storage/v1/s3'
    return url.toString()
  }

  const s3connectionUrl = getConnectionURL()

  return (
    <div>
      <section>
        <FormHeader title="S3 Connection" description="Connect directly to your bucket." />
        <Panel className="grid gap-4 p-4">
          <Input
            className="input-mono"
            layout="horizontal"
            readOnly
            copy
            disabled
            value={s3connectionUrl}
            label="Storage URL"
          />
          {projectIsLoading ? (
            <></>
          ) : (
            <Input
              className="input-mono"
              layout="horizontal"
              readOnly
              copy
              disabled
              value={project?.region}
              label="Region"
            />
          )}
        </Panel>
      </section>
      <section className="flex justify-between mt-8">
        <FormHeader
          title="S3 Credentials"
          description="Manage your S3 credentials for this project."
        />

        <Dialog open={openCreateCred} onOpenChange={setOpenCreateCred}>
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
                <DialogTitle>Save your new storage credential</DialogTitle>
                <DialogDescription>
                  Please save your new storage credentials. You won't be able to see them again. If
                  you lose these credentials, you'll need to create a new ones.
                </DialogDescription>
                <Input
                  className="input-mono"
                  readOnly
                  copy
                  disabled
                  value={createStorageCreds.data?.data?.access_key}
                  label="Access key"
                />
                <Input
                  className="input-mono"
                  readOnly
                  copy
                  disabled
                  value={createStorageCreds.data?.data?.secret_key}
                  label="Secret key"
                />
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
                <DialogTitle>Create new storage credential</DialogTitle>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()

                    const formData = new FormData(e.target as HTMLFormElement)
                    const description = formData.get('description') as string

                    await createStorageCreds.mutateAsync({ description })
                    // toast.success('Storage credentials created')
                    setShowSuccess(true)
                  }}
                >
                  <Label_Shadcn_ htmlFor="description">Description</Label_Shadcn_>
                  <Input
                    autoComplete="off"
                    placeholder="My test key"
                    type="text"
                    name="description"
                    required
                  />
                  <div className="flex justify-end">
                    <Button
                      className="mt-4"
                      htmlType="submit"
                      loading={createStorageCreds.isLoading}
                    >
                      Create credential
                    </Button>
                  </div>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>
      <div
        className={cn([
          'bg-surface-100',
          'overflow-hidden border-muted',
          'rounded-md border shadow',
        ])}
      >
        {storageCredsQuery.isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table
            head={[
              <Table.th key="secret-name">Description</Table.th>,
              <Table.th key="secret-value">Created at</Table.th>,
              <Table.th key="actions" />,
            ]}
            body={
              hasStorageCreds ? (
                storageCreds.data?.map((cred: any) => (
                  <StorageCredItem
                    key={cred.id}
                    created_at={cred.created_at}
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
                  <Table.td colSpan={3}>
                    <p className="text-sm text-foreground">No credentials created</p>
                    <p className="text-sm text-foreground-light">
                      There are no credentials associated with your project yet
                    </p>
                  </Table.td>
                </Table.tr>
              )
            }
          />
        )}
      </div>
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="p-4">
          <DialogTitle>Revoke storage credentials</DialogTitle>
          <DialogDescription>
            This action will permanently revoke the credentials. Requests made with these
            credentials will stop working. Are you sure you want to revoke these credentials?
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
              loading={deleteStorageCreds.isLoading}
              onClick={async () => {
                if (!deleteCredId) return
                await deleteStorageCreds.mutateAsync({ id: deleteCredId })
                setOpenDeleteDialog(false)
                toast.success('Storage credentials revoked')
              }}
            >
              Yes, revoke credentials
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StorageCredItem({
  description,
  id,
  created_at,
  onDeleteClick,
}: {
  description: string
  id: string
  created_at: string
  onDeleteClick: (id: string) => void
}) {
  function daysSince(date: string) {
    const now = new Date()
    const created = new Date(date)
    const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return 'Today'
    } else if (diffInDays === 1) {
      return `${diffInDays} day ago`
    } else {
      return `${diffInDays} days ago`
    }
  }

  return (
    <tr className="h-8">
      <td>{description}</td>
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
