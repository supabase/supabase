import { useFlag } from 'common'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Form,
  FormControl,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { Input as CopyableInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { InlineLink } from '@/components/ui/InlineLink'
import { useAWSAccountCreateMutation } from '@/data/aws-accounts/aws-account-create-mutation'
import type { AWSAccount } from '@/data/aws-accounts/aws-accounts-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { formatDatabaseID, formatDatabaseRegion } from '@/data/read-replicas/replicas.utils'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

interface AWSPrivateLinkFormProps {
  account?: AWSAccount
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormValues {
  awsAccountId: string
  accountName: string
  databaseIdentifier: string
}

export const AWSPrivateLinkForm = ({ account, open, onOpenChange }: AWSPrivateLinkFormProps) => {
  const isNew = !account
  const { data: project } = useSelectedProjectQuery()
  const showPrivateLinkReadReplica = useFlag('privatelinkReadReplica')
  const shouldLoadReadReplicas =
    !!project?.ref &&
    (isNew ? showPrivateLinkReadReplica : account?.database_type === 'READ_REPLICA')
  const { data: databases = [] } = useReadReplicasQuery(
    { projectRef: project?.ref },
    { enabled: shouldLoadReadReplicas }
  )
  const { mutate: createAccount, isPending } = useAWSAccountCreateMutation()

  const readReplicas = databases.filter((database) => database.identifier !== project?.ref)

  const defaultValues = {
    awsAccountId: account?.aws_account_id ?? '',
    accountName: account?.account_name ?? '',
    databaseIdentifier: account?.database_identifier ?? project?.ref ?? '',
  }

  const form = useForm<FormValues>({ defaultValues })

  const title =
    account?.status === 'ASSOCIATION_ACCEPTED'
      ? 'This connection is active'
      : account?.status === 'READY'
        ? 'Connection is ready to accept'
        : account?.status === 'CREATING'
          ? 'This association is being created'
          : account?.status === 'DELETING'
            ? 'This association is being deleted'
            : account?.status === 'ASSOCIATION_REQUEST_EXPIRED'
              ? 'Association acceptance request has expired'
              : account?.status === 'CREATION_FAILED'
                ? 'Failed to create association'
                : 'This association needs to be accepted by the AWS account owner.'

  const description =
    account?.status === 'ASSOCIATION_ACCEPTED'
      ? 'The resource share has been accepted by the AWS account owner and the connection is established.'
      : account?.status === 'READY'
        ? 'It may be waiting acceptance from the AWS account owner. Association requests expire and can no longer be accepted in AWS if not accepted within 12 hours.'
        : account?.status === 'ASSOCIATION_REQUEST_EXPIRED'
          ? 'Reconnect this association to initiate a new connection request'
          : account?.status === 'CREATION_FAILED'
            ? 'Reconnect this association to initiate a new connection request'
            : ''

  const onSubmit = (values: FormValues) => {
    if (!project) return
    if (isNew) {
      createAccount(
        {
          projectRef: project.ref,
          awsAccountId: values.awsAccountId,
          accountName: values.accountName,
          databaseIdentifier:
            values.databaseIdentifier && values.databaseIdentifier !== project.ref
              ? values.databaseIdentifier
              : undefined,
        },
        {
          onSuccess: () => {
            form.reset(defaultValues)
            toast.success('Successfully added association')
            onOpenChange(false)
          },
        }
      )
    }
  }

  // Reset form when account changes
  useEffect(() => {
    form.reset({
      awsAccountId: account?.aws_account_id ?? '',
      accountName: account?.account_name ?? '',
      databaseIdentifier: account?.database_identifier ?? project?.ref ?? '',
    })
  }, [account, form, project?.ref])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{isNew ? 'Add Association' : 'Association Details'}</SheetTitle>
          <SheetDescription>
            Connect to your Supabase project from your AWS VPC using AWS PrivateLink.{' '}
            <InlineLink href={`${DOCS_URL}/guides/platform/privatelink`}>Learn more</InlineLink>
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <SheetSection className="space-y-4 flex-1 overflow-y-auto">
              {!isNew && account && (
                <>
                  <Admonition
                    showIcon={false}
                    type="default"
                    childProps={{ title: { className: 'flex-row gap-x-2 items-center' } }}
                    // @ts-ignore
                    title={
                      <>
                        <span>{title}</span>
                        <Badge
                          className="ml-2"
                          variant={
                            account.status === 'ASSOCIATION_ACCEPTED'
                              ? 'success'
                              : account.status === 'READY'
                                ? 'success'
                                : account.status === 'CREATING'
                                  ? 'warning'
                                  : account.status === 'CREATION_FAILED' ||
                                      account.status === 'ASSOCIATION_REQUEST_EXPIRED'
                                    ? 'destructive'
                                    : 'warning'
                          }
                        >
                          {account.status === 'ASSOCIATION_ACCEPTED'
                            ? 'Connected'
                            : account.status === 'READY'
                              ? 'Ready'
                              : account.status === 'CREATING'
                                ? 'Creating'
                                : account.status === 'CREATION_FAILED'
                                  ? 'Failed'
                                  : account.status === 'ASSOCIATION_REQUEST_EXPIRED'
                                    ? 'Expired'
                                    : account.status === 'DELETING'
                                      ? 'Deleting'
                                      : 'Unknown'}
                        </Badge>
                      </>
                    }
                    description={description}
                    actions={
                      account.status === 'READY' && (
                        <Button variant="default" className="w-min" icon={<ExternalLink />}>
                          <Link
                            target="_blank"
                            rel="noopener noreferrer"
                            href={`${DOCS_URL}/guides/platform/privatelink#step-2-accept-resource-share`}
                          >
                            How to accept?
                          </Link>
                        </Button>
                      )
                    }
                  />
                </>
              )}
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItemLayout
                    label="Association Description"
                    description="A description for this association."
                  >
                    <FormControl>
                      <Input
                        {...field}
                        readOnly={!isNew}
                        onFocus={(e) => {
                          if (!isNew) {
                            e.target.blur()
                          }
                        }}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              {(showPrivateLinkReadReplica || !isNew) && (
                <FormField
                  control={form.control}
                  name="databaseIdentifier"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Database target"
                      description="Associations are created per database target. The same AWS account can be associated with both primary and replica databases."
                    >
                      <FormControl>
                        <Select
                          value={field.value}
                          disabled={!isNew || !project?.ref}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a database" />
                          </SelectTrigger>
                          <SelectContent>
                            {project?.ref && (
                              <SelectItem value={project.ref}>Primary database</SelectItem>
                            )}
                            {readReplicas.map((database) => {
                              const region =
                                formatDatabaseRegion(database.region) ?? database.region
                              const id = formatDatabaseID(database.identifier)

                              return (
                                <SelectItem key={database.identifier} value={database.identifier}>
                                  {`Read replica (${region} - ${id})`}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="awsAccountId"
                render={({ field }) => (
                  <FormItemLayout
                    label="AWS Account ID"
                    description="The ID of the AWS account you want to connect to."
                  >
                    <FormControl>
                      <Input
                        {...field}
                        readOnly={!isNew}
                        autoFocus={isNew}
                        onFocus={(e) => {
                          if (!isNew) {
                            e.target.blur()
                          }
                        }}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              {!isNew && account?.resource_access_manager_resource_config_id && (
                <FormItemLayout
                  label="Resource Configuration ID"
                  description="The AWS VPC Lattice resource configuration ID for this association."
                >
                  <CopyableInput
                    readOnly
                    copy
                    value={account.resource_access_manager_resource_config_id}
                  />
                </FormItemLayout>
              )}
              {!isNew && account?.resource_access_manager_resource_config_arn && (
                <FormItemLayout
                  label="Resource Configuration ARN"
                  description="The ARN of the AWS VPC Lattice resource configuration."
                >
                  <CopyableInput
                    readOnly
                    copy
                    value={account.resource_access_manager_resource_config_arn}
                  />
                </FormItemLayout>
              )}
              {!isNew && account?.resource_access_manager_share_arn && (
                <FormItemLayout
                  label="Resource Share ARN"
                  description="The ARN of the AWS RAM resource share."
                >
                  <CopyableInput readOnly copy value={account.resource_access_manager_share_arn} />
                </FormItemLayout>
              )}
            </SheetSection>

            <SheetFooter>
              <Button variant="default" disabled={isPending} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {isNew && (
                <Button type="submit" loading={isPending}>
                  Add Association
                </Button>
              )}
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
