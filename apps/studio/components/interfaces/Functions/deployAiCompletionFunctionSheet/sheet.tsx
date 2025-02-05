import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common/hooks/useParams'
import console from 'console'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import { useSecretsCreateMutation } from 'data/secrets/secrets-create-mutation'
import {
  Button,
  ExpandingTextArea,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Separator,
  SheetClose,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { generateFunctionCode } from './utils'

const FORM_ID = 'create-ai-completion-function'

const FormSchema = z.object({
  prompt: z.string().default(''),
  apiUrl: z.string().url('Must be a valid URL'),
  apiKey: z.string().min(1, 'API key is required'),
  name: z.string().min(1, 'Name is required'),
  stream: z.boolean().default(false),
  verifyJwt: z.boolean().default(false),
})

interface NewAiCompletionFunctionDialogProps {
  onClose: () => void
}

export const DeployAiCompletionFunctionSheetContent = ({
  onClose,
}: NewAiCompletionFunctionDialogProps) => {
  const { ref: projectRef } = useParams()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: '',
      apiUrl: 'https://openai.com/sdk/v1',
      apiKey: '',
      name: '',
      stream: false,
      verifyJwt: false,
    },
  })

  const { mutateAsync: deployEdgeFunction, isLoading: isDeploying } =
    useEdgeFunctionDeployMutation()

  const { mutateAsync: createSecret, isLoading: isSavingSecret } = useSecretsCreateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    const toastId = toast.loading('Deploying function...')
    try {
      const content = generateFunctionCode(values.prompt, values.apiUrl, 'gpt-4o', values.stream)

      console.log(content)
      const deployResult = await deployEdgeFunction({
        projectRef: projectRef!,
        metadata: {
          entrypoint_path: 'index.ts',
          import_map_path: 'import_map.json',
          name: values.name,
          verify_jwt: values.verifyJwt,
        },
        files: [{ name: 'index.ts', content }],
      })
      console.log(deployResult)

      toast.loading('Saving the API key as a secret...', { id: toastId })

      createSecret({ projectRef, secrets: [{ name: 'OPENAI_API_KEY', value: values.apiKey }] })

      toast.success('Edge function deployed successfully', { id: toastId })

      onClose()
    } catch (error) {
      console.error(error)
      toast.dismiss(toastId)
    }
  }

  return (
    <>
      <SheetHeader className="py-3 flex flex-row justify-between items-center border-b-0">
        <div className="flex flex-row gap-3 items-center">
          <SheetClose
            className={cn(
              'text-muted hover:text ring-offset-background transition-opacity hover:opacity-100',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:pointer-events-none data-[state=open]:bg-secondary'
            )}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Close</span>
          </SheetClose>
          <SheetTitle>Create AI Completion Function</SheetTitle>
        </div>
      </SheetHeader>
      <Separator />
      <SheetSection className="overflow-auto flex-grow px-0">
        <Form_Shadcn_ {...form}>
          <form
            id={FORM_ID}
            className="space-y-6 w-full py-5 flex-1"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField_Shadcn_
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItemLayout
                  label="Prompt"
                  description="Enter your AI completion prompt"
                  className="px-5"
                >
                  <FormControl_Shadcn_>
                    <ExpandingTextArea {...field} placeholder="Enter your prompt here..." />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <div className="space-y-4 px-5">
              <FormField_Shadcn_
                control={form.control}
                name="apiUrl"
                render={({ field }) => (
                  <FormItemLayout
                    label="API URL"
                    description="An OpenAI compatible base URL. Defaults to OpenAI URL."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="https://api.example.com" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItemLayout label="API Key" description="API key for the AI provider">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="Enter your API key" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout
                    label="Function name"
                    description={
                      <span>
                        The function will be accessible at{' '}
                        <code className="text-brand text-xs">/v1/{field.value}</code>
                      </span>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <div className="space-y-4">
                <FormField_Shadcn_
                  control={form.control}
                  name="stream"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex"
                      label="Enable streaming"
                      description="Stream the AI response as it's generated"
                    >
                      <FormControl_Shadcn_>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                <FormField_Shadcn_
                  control={form.control}
                  name="verifyJwt"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex"
                      label="Verify JWT"
                      description="Require authorization checks to call the function"
                    >
                      <FormControl_Shadcn_>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </div>
            </div>
          </form>
        </Form_Shadcn_>
      </SheetSection>
      <SheetFooter>
        <Button type="default" onClick={() => onClose()} disabled={isSavingSecret || isDeploying}>
          Cancel
        </Button>
        <Button form={FORM_ID} htmlType="submit" disabled={isSavingSecret || isDeploying}>
          Create function
        </Button>
      </SheetFooter>
    </>
  )
}
