import { zodResolver } from '@hookform/resolvers/zod'
import { useFlag } from 'common'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
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
import { z } from 'zod'

import { getConnectionStatusUi } from './AWSPrivateLink.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { useAWSAccountCreateMutation } from '@/data/aws-accounts/aws-account-create-mutation'
import type { AWSAccount } from '@/data/aws-accounts/aws-accounts-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { formatDatabaseID, formatDatabaseRegion } from '@/data/read-replicas/replicas.utils'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

const FORM_ID = 'privatelink-connection-form'

const FormSchema = z.object({
  awsAccountId: z
    .string()
    .trim()
    .regex(/^\d{12}$/, 'Enter a 12-digit AWS account ID'),
  databaseIdentifier: z.string().min(1, 'Select a database'),
  accountName: z.string(),
})

type FormValues = z.infer<typeof FormSchema>

interface AWSPrivateLinkFormProps {
  account?: AWSAccount
  open: boolean
  onOpenChange: (open: boolean) => void
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
  const showDatabaseTarget = showPrivateLinkReadReplica || !isNew
  const statusUi = getConnectionStatusUi(account?.status)
  const formValues: FormValues = {
    awsAccountId: account?.aws_account_id ?? '',
    databaseIdentifier: account?.database_identifier ?? project?.ref ?? '',
    accountName: account?.account_name ?? '',
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      awsAccountId: '',
      databaseIdentifier: '',
      accountName: '',
    },
    values: formValues,
    resetOptions: { keepDirtyValues: true },
  })

  const onSubmit = (values: FormValues) => {
    if (!project) return
    if (isNew) {
      createAccount(
        {
          projectRef: project.ref,
          awsAccountId: values.awsAccountId,
          accountName: values.accountName.trim() || undefined,
          databaseIdentifier:
            values.databaseIdentifier && values.databaseIdentifier !== project.ref
              ? values.databaseIdentifier
              : undefined,
        },
        {
          onSuccess: () => {
            form.reset(formValues)
            toast.success('Connection added')
            onOpenChange(false)
          },
        }
      )
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) form.reset(formValues)
    onOpenChange(nextOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{isNew ? 'Add connection' : 'Connection details'}</SheetTitle>
          <SheetDescription>
            {isNew
              ? 'Enter an AWS account to connect. You’ll need to accept the share in AWS. '
              : 'These values identify the resource share in AWS. '}
            <InlineLink href={`${DOCS_URL}/guides/platform/privatelink`}>Learn more</InlineLink>
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <SheetSection className="space-y-4 flex-1 overflow-y-auto">
              {!isNew && account && (
                <Admonition
                  showIcon={false}
                  type="default"
                  childProps={{ title: { className: 'flex-row gap-x-2 items-center' } }}
                  // @ts-ignore
                  title={
                    <>
                      <span>{statusUi.title}</span>
                      <Badge className="ml-2" variant={statusUi.badgeVariant}>
                        {statusUi.badge}
                      </Badge>
                    </>
                  }
                  description={statusUi.description}
                  actions={
                    account.status === 'READY' && (
                      <Button variant="default" className="w-min" icon={<ExternalLink />}>
                        <Link
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`${DOCS_URL}/guides/platform/privatelink#step-2-accept-resource-share`}
                        >
                          How to accept
                        </Link>
                      </Button>
                    )
                  }
                />
              )}
              <FormField
                control={form.control}
                name="awsAccountId"
                render={({ field }) => (
                  <FormItemLayout
                    label="AWS account ID"
                    description="12-digit ID of the destination account."
                  >
                    <FormControl>
                      <Input
                        {...field}
                        readOnly={!isNew}
                        autoFocus={isNew}
                        placeholder="123456789012"
                        onFocus={(e) => {
                          if (!isNew) e.target.blur()
                        }}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              {showDatabaseTarget && (
                <FormField
                  control={form.control}
                  name="databaseIdentifier"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Database"
                      description="Each database needs its own connection."
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
                name="accountName"
                render={({ field }) => (
                  <FormItemLayout label="Description" labelOptional="Optional">
                    <FormControl>
                      <Input
                        {...field}
                        readOnly={!isNew}
                        onFocus={(e) => {
                          if (!isNew) e.target.blur()
                        }}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              {!isNew && account?.resource_access_manager_resource_config_id && (
                <FormItemLayout label="Resource configuration ID">
                  <CopyableInput
                    readOnly
                    copy
                    value={account.resource_access_manager_resource_config_id}
                  />
                </FormItemLayout>
              )}
              {!isNew && account?.resource_access_manager_resource_config_arn && (
                <FormItemLayout label="Resource configuration ARN">
                  <CopyableInput
                    readOnly
                    copy
                    value={account.resource_access_manager_resource_config_arn}
                  />
                </FormItemLayout>
              )}
              {!isNew && account?.resource_access_manager_share_arn && (
                <FormItemLayout label="Resource share ARN">
                  <CopyableInput readOnly copy value={account.resource_access_manager_share_arn} />
                </FormItemLayout>
              )}
            </SheetSection>

            <SheetFooter>
              <Button
                type="button"
                variant="default"
                disabled={isPending}
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              {isNew && (
                <Button form={FORM_ID} type="submit" loading={isPending}>
                  Add connection
                </Button>
              )}
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
