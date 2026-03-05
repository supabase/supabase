import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { InlineLink } from 'components/ui/InlineLink'
import { useAWSAccountCreateMutation } from 'data/aws-accounts/aws-account-create-mutation'
import type { AWSAccount } from 'data/aws-accounts/aws-accounts-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import {
  Badge,
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface AWSPrivateLinkFormProps {
  account?: AWSAccount
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormValues {
  awsAccountId: string
  accountName: string
}

export const AWSPrivateLinkForm = ({ account, open, onOpenChange }: AWSPrivateLinkFormProps) => {
  const isNew = !account
  const { data: project } = useSelectedProjectQuery()
  const { mutate: createAccount, isPending } = useAWSAccountCreateMutation()

  const form = useForm<FormValues>({
    defaultValues: {
      awsAccountId: account?.aws_account_id ?? '',
      accountName: account?.account_name ?? '',
    },
  })

  const title =
    account?.status === 'ASSOCIATION_ACCEPTED'
      ? 'This connection is active'
      : account?.status === 'READY'
        ? 'Connection is ready'
        : account?.status === 'CREATING'
          ? 'This account connection is being created'
          : account?.status === 'DELETING'
            ? 'This account is being deleted'
            : account?.status === 'ASSOCIATION_REQUEST_EXPIRED'
              ? 'Account acceptance request has expired'
              : account?.status === 'CREATION_FAILED'
                ? 'Failed to create account'
                : 'This account needs to be accepted by the AWS account owner.'

  const description =
    account?.status === 'ASSOCIATION_ACCEPTED'
      ? 'The resource share has been accepted by the AWS account owner and the connection is established.'
      : account?.status === 'READY'
        ? 'It may be waiting acceptance from the AWS account owner. Association requests are automatically deleted if not accepted within 12 hours.'
        : account?.status === 'ASSOCIATION_REQUEST_EXPIRED'
          ? 'Reconnect this account to initiate a new connection request'
          : account?.status === 'CREATION_FAILED'
            ? 'Reconnect this account to initiate a new connection request'
            : ''

  const onSubmit = (values: FormValues) => {
    if (!project) return
    if (isNew) {
      createAccount(
        {
          projectRef: project.ref,
          awsAccountId: values.awsAccountId,
          accountName: values.accountName,
        },
        {
          onSuccess: () => {
            toast.success('Successfully added AWS account')
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
    })
  }, [account, form])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{isNew ? 'Add AWS Account' : 'AWS Account Details'}</SheetTitle>
          <SheetDescription>
            Connect to your Supabase project from your AWS VPC using AWS PrivateLink.{' '}
            <InlineLink href={`${DOCS_URL}/guides/platform/privatelink`}>Learn more</InlineLink>
          </SheetDescription>
        </SheetHeader>
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <SheetSection className="space-y-4 flex-1">
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
                        <Button type="default" className="w-min mt-2">
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
              <FormField_Shadcn_
                control={form.control}
                name="awsAccountId"
                render={({ field }) => (
                  <FormItemLayout
                    label="AWS Account ID"
                    description="The ID of the AWS account you want to connect to."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        readOnly={!isNew}
                        autoFocus={isNew}
                        onFocus={(e) => {
                          if (!isNew) {
                            e.target.blur()
                          }
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItemLayout
                    label="Account Name"
                    description="A name for this account connection."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        readOnly={!isNew}
                        onFocus={(e) => {
                          if (!isNew) {
                            e.target.blur()
                          }
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>

            <SheetFooter>
              <Button type="default" disabled={isPending} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {isNew && (
                <Button htmlType="submit" loading={isPending}>
                  Add Account
                </Button>
              )}
            </SheetFooter>
          </form>
        </Form_Shadcn_>
      </SheetContent>
    </Sheet>
  )
}
