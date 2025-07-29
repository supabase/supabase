import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  SheetDescription,
  SheetSection,
  Label_Shadcn_,
  Badge,
  Input_Shadcn_,
  Card,
  CardContent,
} from 'ui'
import { useForm } from 'react-hook-form'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { Admonition } from 'ui-patterns'
import { AWSAccount } from 'data/aws-accounts/aws-accounts-query'
import { useAWSAccountCreateMutation } from 'data/aws-accounts/aws-account-create-mutation'
import { useAWSAccountUpdateMutation } from 'data/aws-accounts/aws-account-update-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'

interface AWSPrivateLinkFormProps {
  account?: AWSAccount
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AWSPrivateLinkForm = ({ account, open, onOpenChange }: AWSPrivateLinkFormProps) => {
  const isNew = !account
  const project = useSelectedProject()
  const { mutate: createAccount } = useAWSAccountCreateMutation()
  const { mutate: updateAccount } = useAWSAccountUpdateMutation()

  const form = useForm({
    defaultValues: {
      awsAccountId: account?.awsAccountId ?? '',
      description: account?.description ?? '',
    },
  })

  const onSubmit = (values: any) => {
    if (!project) return
    if (isNew) {
      createAccount(
        {
          projectRef: project.ref,
          awsAccountId: values.awsAccountId,
          description: values.description,
        },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      updateAccount(
        {
          projectRef: project.ref,
          id: account.id,
          awsAccountId: values.awsAccountId,
          description: values.description,
        },
        { onSuccess: () => onOpenChange(false) }
      )
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{isNew ? 'Add' : 'Edit'} AWS Account</SheetTitle>
          <SheetDescription>
            Connect to your Supabase project from your AWS VPC using AWS PrivateLink.
          </SheetDescription>
        </SheetHeader>
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <SheetSection className="space-y-4 flex-1">
              {!isNew && account.status && (
                <Card className="mb-6">
                  <CardContent className="flex items-center gap-2">
                    <p className="text-sm flex-1">
                      {account.status === 'connected'
                        ? 'This account has been accepted by the AWS account owner.'
                        : 'This account needs to be accepted by the AWS account owner.'}
                    </p>
                    <Badge variant={account.status === 'connected' ? 'success' : 'warning'}>
                      {account.status === 'connected' ? 'Connected' : 'Pending'}
                    </Badge>
                  </CardContent>
                </Card>
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
                      <Input_Shadcn_ {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItemLayout label="Description" description="A description for this account.">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>

            <SheetFooter>
              <Button type="default" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button htmlType="submit">{isNew ? 'Add' : 'Save'}</Button>
            </SheetFooter>
          </form>
        </Form_Shadcn_>
      </SheetContent>
    </Sheet>
  )
}

export default AWSPrivateLinkForm
