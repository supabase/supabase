import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
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
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const FORM_ID = 'create-ai-completion-function'

const FormSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  apiUrl: z.string().url('Must be a valid URL'),
  apiKey: z.string().min(1, 'API key is required'),
  name: z.string().min(1, 'Endpoint is required'),
})

interface NewAiCompletionFunctionDialogProps {
  onClose: () => void
}

export const DeployAiCompletionFunctionSheet = ({
  onClose,
}: NewAiCompletionFunctionDialogProps) => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: '',
      apiUrl: '',
      apiKey: '',
      name: '',
    },
  })

  const { mutateAsync } = useEdgeFunctionDeployMutation()

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    try {
      await mutateAsync({
        projectRef: 'projectRef',
        metadata: {
          entrypoint_path: 'index.ts',
          import_map_path: 'import_map.json',
          name: values.name,
          verify_jwt: false,
        },
        files: [{ name: 'index.ts', content: values.prompt }],
      })
      toast.success('Successfully created AI completion function')
      onClose()
    } catch (error) {
      toast.error('Failed to create AI completion function')
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
                  <FormItemLayout label="API URL" description="Enter the API base URL">
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
                  <FormItemLayout label="API Key" description="Enter your API key">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} type="password" placeholder="Enter your API key" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="endpoint"
                render={({ field }) => (
                  <FormItemLayout
                    label="API Endpoint"
                    description="Enter the specific API endpoint"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="/v1/completions" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </div>
          </form>
        </Form_Shadcn_>
      </SheetSection>
      <SheetFooter>
        <Button type="default" onClick={() => onClose()}>
          Cancel
        </Button>
        <Button form={FORM_ID} htmlType="submit">
          Create function
        </Button>
      </SheetFooter>
    </>
  )
}
