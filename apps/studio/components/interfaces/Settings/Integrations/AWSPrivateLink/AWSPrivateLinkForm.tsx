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

interface AWSPrivateLinkFormProps {
  awsAccountId?: string
  region?: string
  status?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AWSPrivateLinkForm = ({
  awsAccountId,
  region,
  status,
  open,
  onOpenChange,
}: AWSPrivateLinkFormProps) => {
  const isNew = !awsAccountId
  const form = useForm({
    defaultValues: {
      awsAccountId: awsAccountId ?? '',
      region: region ?? '',
    },
  })

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
          <form onSubmit={form.handleSubmit(() => {})} className="flex flex-col flex-1">
            <SheetSection className="space-y-4 flex-1">
              {!isNew && status && (
                <Card className="mb-6">
                  <CardContent className="flex items-center gap-2">
                    <p className="text-sm flex-1">
                      This account needs to be accepted by the AWS account owner
                    </p>
                    <Badge variant="success">Connected</Badge>
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
                name="region"
                render={({ field }) => (
                  <FormItemLayout
                    label="Region"
                    description="The AWS region where your VPC is located."
                  >
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
