import { zodResolver } from '@hookform/resolvers/zod'
import { Trash } from 'lucide-react'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { useCreateThirdPartyAuthIntegrationMutation } from 'data/third-party-auth/integration-create-mutation'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Separator,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { AwsRegionSelector } from './AwsRegionSelector'

interface CreateAwsCognitoAuthIntegrationProps {
  visible: boolean
  onClose: () => void
  // TODO: Remove this if this Dialog is only used for creating.
  onDelete: () => void
}

const FORM_ID = 'create-aws-cognito-auth-integration-form'

const FormSchema = z.object({
  enabled: z.boolean(),
  awsCognitoUserPoolId: z
    .string()
    .trim()
    .min(1)
    .regex(/^[A-Za-z0-9-_]+$/, 'The project ID contains invalid characters.'), // Only allow alphanumeric characters and hyphens.
  awsRegion: z.string(),
})

export const CreateAwsCognitoAuthIntegrationDialog = ({
  visible,
  onClose,
  onDelete,
}: CreateAwsCognitoAuthIntegrationProps) => {
  // TODO: Remove this if this Dialog is only used for creating.
  const isCreating = true

  const { ref: projectRef } = useParams()
  const { mutate: createAuthIntegration, isLoading } = useCreateThirdPartyAuthIntegrationMutation({
    onSuccess: () => {
      toast.success(`Successfully created a new Amazon Cognito Auth integration.`)
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
      // the form input doesn't exist when the form is reset
      setTimeout(() => {
        form.setFocus('awsCognitoUserPoolId')
      }, 25)
    }
  }, [visible])

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    createAuthIntegration({
      projectRef: projectRef!,
      oidcIssuerUrl: `https://cognito-idp.${values.awsRegion}.amazonaws.com/${values.awsCognitoUserPoolId}`,
    })
  }

  const awsRegion = form.watch('awsRegion')

  return (
    <Dialog open={visible} onOpenChange={() => onClose()}>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle className="truncate">
            {isCreating
              ? `Add new Amazon Cognito Auth connection`
              : `Update existing Amazon Cognito Auth connection`}
          </DialogTitle>
          <DialogDescription>
            By adding an Amazon Cognito Auth connection, you can authenticate users using Amazon
            Cognito User Pools.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <DialogSection>
          <Form_Shadcn_ {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Enabled flag can't be changed for now because there's no update API call for integrations */}
              {/* <FormField_Shadcn_
              key="enabled"
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItemLayout
                  className="px-8"
                  label={`Enable Amazon Cognito Auth Connection`}
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
              <p className="text-sm text-foreground-light">
                This will enable a JWT token from Amazon Cognito project to access data from this
                Supabase project.
              </p>
              <FormField_Shadcn_
                key="awsCognitoUserPoolId"
                control={form.control}
                name="awsCognitoUserPoolId"
                render={({ field }) => (
                  <FormItemLayout label="Amazon Cognito User Pool ID">
                    <div className="flex flex-row">
                      <Button
                        type="default"
                        size="small"
                        className="px-2 text-foreground-light rounded-r-none"
                        onClick={() => form.setFocus('awsCognitoUserPoolId')}
                      >
                        https://cognito-idp.{awsRegion}.amazonaws.com/
                      </Button>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ className="rounded-l-none border-l-0 z-50" {...field} />
                      </FormControl_Shadcn_>
                    </div>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="awsRegion"
                render={({ field }) => (
                  <FormItemLayout label="AWS Region">
                    <AwsRegionSelector value={field.value} onChange={field.onChange} />
                  </FormItemLayout>
                )}
              />
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
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
            {isCreating ? 'Create connection' : 'Update connection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
