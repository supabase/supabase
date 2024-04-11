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
import { GenericSkeletonLoader } from 'ui-patterns'
import CopyButton from 'components/ui/CopyButton'
import { differenceInDays } from 'date-fns'
import { useProjectApiQuery } from 'data/config/project-api-query'

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

  const createStorageCreds = useStorageCredentialsCreateMutation({
    projectRef,
  })

  const deleteStorageCreds = useStorageCredentialsDeleteMutation({
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
      <div className="flex justify-between items-end mt-8">
        <FormHeader
          className="!mb-0"
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
                    placeholder="Key description"
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
      </div>

      <div
        className={cn([
          'bg-surface-100',
          'overflow-hidden border-muted',
          'rounded-md border shadow mt-6',
        ])}
      >
        {storageCredsQuery.isLoading ? (
          <div className="p-4">
            <GenericSkeletonLoader />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              className=""
              head={[
                <Table.th key="">Description</Table.th>,
                <Table.th key="">Access key</Table.th>,
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
