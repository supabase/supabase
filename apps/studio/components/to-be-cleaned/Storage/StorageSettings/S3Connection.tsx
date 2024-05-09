import { differenceInDays } from 'date-fns'
import React from 'react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTitle } from '@ui/components/shadcn/ui/alert'
import { useParams } from 'common'
import {
  useIsProjectActive,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import CopyButton from 'components/ui/CopyButton'
import { FormHeader } from 'components/ui/Forms'
import Panel from 'components/ui/Panel'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useS3AccessKeyCreateMutation } from 'data/storage/s3-access-key-create-mutation'
import { useS3AccessKeyDeleteMutation } from 'data/storage/s3-access-key-delete-mutation'
import { useStorageCredentialsQuery } from 'data/storage/s3-access-key-query'
import { AlertCircle, MoreVertical, TrashIcon } from 'lucide-react'
import Link from 'next/link'
import {
  AlertDescription_Shadcn_,
  Alert_Shadcn_,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { FormField } from '@ui/components/shadcn/ui/form'

export const S3Connection = () => {
  const [openCreateCred, setOpenCreateCred] = React.useState(false)
  const [showSuccess, setShowSuccess] = React.useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false)
  const [deleteCred, setDeleteCred] = React.useState<{ id: string; description: string } | null>(
    null
  )

  const { ref: projectRef } = useParams()
  const { project, isLoading: projectIsLoading } = useProjectContext()

  const isProjectActive = useIsProjectActive()

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

  const FormSchema = z.object({
    description: z.string().min(3, {
      message: 'Description must be at least 3 characters long',
    }),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: '',
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    await createS3AccessKey.mutateAsync(data)
    setShowSuccess(true)
  }

  return (
    <>
      <div>
        <FormHeader
          title="S3 Connection"
          description="Connect to your bucket via the S3 protocol."
          docsUrl="https://supabase.com/docs/guides/storage/s3/authentication"
        />
        {isProjectActive ? (
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
            <AlertCircle />
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
            <Dialog
              open={openCreateCred}
              onOpenChange={(open) => {
                setOpenCreateCred(open)
                if (!open) setShowSuccess(false)
              }}
            >
              <Tooltip_Shadcn_>
                <TooltipTrigger_Shadcn_ asChild>
                  <DialogTrigger asChild>
                    <Button type="default" disabled={!isProjectActive}>
                      New access key
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger_Shadcn_>
                {!isProjectActive && (
                  <TooltipContent_Shadcn_>
                    Restore your project to create new access keys
                  </TooltipContent_Shadcn_>
                )}
              </Tooltip_Shadcn_>

              <DialogContent
                onInteractOutside={(e) => {
                  if (showSuccess) {
                    e.preventDefault()
                  }
                }}
              >
                {showSuccess ? (
                  <>
                    <DialogHeader>
                      <DialogTitle>Save your new S3 access keys</DialogTitle>
                      <DialogDescription>
                        You won't be able to see them again. If you lose these access keys, you'll
                        need to create a new ones.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogSectionSeparator />
                    <DialogSection className="flex flex-col gap-4">
                      <FormItemLayout label="Access key ID" isReactForm={false}>
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
                    </DialogSection>
                    <DialogFooter>
                      <Button
                        onClick={() => {
                          setOpenCreateCred(false)
                          setShowSuccess(false)
                        }}
                      >
                        Done
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>Create new S3 access keys</DialogTitle>
                      <DialogDescription>
                        S3 access keys provide full access to all S3 operations across all buckets
                        and bypass any existing RLS policies.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogSectionSeparator />
                    <Form_Shadcn_ {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)}>
                        <DialogSection>
                          <FormField
                            name="description"
                            render={({ field }) => (
                              <FormItemLayout label="Description">
                                <Input
                                  autoComplete="off"
                                  placeholder="My test key"
                                  type="text"
                                  {...form.register('description')}
                                />
                              </FormItemLayout>
                            )}
                          />
                        </DialogSection>

                        <DialogFooter>
                          <Button
                            className="mt-4"
                            htmlType="submit"
                            loading={createS3AccessKey.isLoading}
                          >
                            Create access key
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form_Shadcn_>
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
          {!isProjectActive ? (
            <Alert_Shadcn_ variant="warning">
              <AlertCircle />
              <AlertTitle>Can't fetch S3 access keys</AlertTitle>
              <AlertDescription_Shadcn_>
                To fetch your S3 access keys, you need to restore your project.
              </AlertDescription_Shadcn_>
              <div className="mt-3 flex items-center space-x-2">
                <Button asChild type="default">
                  <Link href={`/project/${projectRef}`}>Restore project</Link>
                </Button>
              </div>
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
                          <Table.td colSpan={4}>
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
      </div>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Revoke <code>{deleteCred?.description}</code> credential
            </DialogTitle>
            <DialogDescription>
              This action is irreversible and requests made with these access keys will stop
              working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-1">
            <Button
              type="outline"
              onClick={() => {
                setOpenDeleteDialog(false)
                setDeleteCred(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="danger"
              loading={deleteS3AccessKey.isLoading}
              onClick={async () => {
                if (!deleteCred) return
                await deleteS3AccessKey.mutateAsync({ id: deleteCred.id })
                setOpenDeleteDialog(false)
                toast.success('S3 access keys revoked')
              }}
            >
              Yes, revoke access keys
            </Button>
          </DialogFooter>
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
      <td>
        <span className="text-foreground">{description}</span>
      </td>
      <td>
        <div className="flex items-center justify-between">
          <span className="text-ellipsis font-mono cursor-default">{access_key}</span>
          <span className="w-24 text-right opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={access_key} type="default" />
          </span>
        </div>
      </td>
      <td>{daysSince(created_at)}</td>
      <td className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              icon={<MoreVertical size={14} strokeWidth={1} />}
              type="text"
              className="px-1.5 text-foreground-lighter hover:text-foreground"
            ></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-40" align="end">
            <DropdownMenuItem
              className="flex gap-1.5 "
              onClick={(e) => {
                e.preventDefault()
                onDeleteClick(id)
              }}
            >
              <TrashIcon size="14" />
              Revoke key
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
