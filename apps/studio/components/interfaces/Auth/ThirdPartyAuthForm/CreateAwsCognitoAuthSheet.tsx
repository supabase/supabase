import { zodResolver } from '@hookform/resolvers/zod'
import { Trash, X } from 'lucide-react'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as z from 'zod'

import { useParams } from 'common'
import { useCreateThirdPartyAuthIntegrationMutation } from 'data/third-party-auth/integration-create-mutation'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { AwsRegionSelector } from './AwsRegionSelector'

interface CreateAwsCognitoAuthIntegrationProps {
  visible: boolean
  onClose: () => void
  // TODO: Remove this if this sheet is only used for creating.
  onDelete: () => void
}

const FORM_ID = 'create-aws-cognito-auth-integration-form'

const FormSchema = z.object({
  enabled: z.boolean(),
  awsCognitoUserPoolId: z.string().min(1),
  awsRegion: z.string(),
})

export const CreateAwsCognitoAuthIntegrationSheet = ({
  visible,
  onClose,
  onDelete,
}: CreateAwsCognitoAuthIntegrationProps) => {
  // TODO: Remove this if this sheet is only used for creating.
  const isCreating = true

  const { ref: projectRef } = useParams()
  const { mutate: createAuthIntegration, isLoading } = useCreateThirdPartyAuthIntegrationMutation({
    onSuccess: () => {
      toast.success(`Successfully created a new AWS Cognito Auth integration.`)
      onClose()
    },
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      enabled: true,
      awsCognitoUserPoolId: '',
      awsRegion: 'us-east-1',
    },
  })

  useEffect(() => {
    if (visible) {
      form.reset({
        enabled: true,
        awsCognitoUserPoolId: '',
        awsRegion: 'us-east-1',
      })
    }
  }, [visible])

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    createAuthIntegration({
      projectRef: projectRef!,
      oidcIssuerUrl: `https://cognito-idp.${values.awsRegion}.amazonaws.com/${values.awsCognitoUserPoolId}`,
    })
  }

  return (
    <Sheet open={visible} onOpenChange={() => onClose()}>
      <SheetContent showClose={false} className="flex flex-col gap-0">
        <SheetHeader className="py-3 flex flex-row justify-between items-center border-b-0">
          <div className="flex flex-row gap-3 items-center">
            <SheetClose
              className={cn(
                'text-muted hover:text ring-offset-background transition-opacity hover:opacity-100',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:pointer-events-none data-[state=open]:bg-secondary',
                'transition'
              )}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Close</span>
            </SheetClose>
            <SheetTitle className="truncate">
              {isCreating
                ? `Add new AWS Cognito Auth connection`
                : `Update existing AWS Cognito Auth connection`}
            </SheetTitle>
          </div>
        </SheetHeader>
        <Separator />
        <Form_Shadcn_ {...form}>
          <form
            id={FORM_ID}
            className="space-y-6 w-full py-8 flex-1"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            {/* Enabled flag can't be changed for now because there's no update API call for integrations */}
            {/* <FormField_Shadcn_
              key="enabled"
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItemLayout
                  className="px-8"
                  label={`Enable AWS Cognito Auth Connection`}
                  layout="flex"
                >
                  <FormControl_Shadcn_>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={field.disabled}
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <Separator /> */}

            <div className="flex flex-col px-8 gap-4">
              <FormField_Shadcn_
                key="awsCognitoUserPoolId"
                control={form.control}
                name="awsCognitoUserPoolId"
                render={({ field }) => (
                  <FormItemLayout label="AWS Cognito User Pool ID">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="awsRegion"
                render={({ field }) => (
                  <FormItemLayout label="Return type">
                    <AwsRegionSelector value={field.value} onChange={field.onChange} />
                  </FormItemLayout>
                )}
              />
            </div>
          </form>
        </Form_Shadcn_>
        <SheetFooter>
          {!isCreating && (
            <div className="flex-1">
              <Button type="danger" onClick={() => onDelete()} icon={<Trash />}>
                Remove connection
              </Button>
            </div>
          )}

          <Button disabled={isLoading} type="default" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button form={FORM_ID} htmlType="submit" disabled={isLoading} loading={isLoading}>
            {isCreating ? 'Create' : 'Update'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
