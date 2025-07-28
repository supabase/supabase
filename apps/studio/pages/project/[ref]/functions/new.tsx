import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Book, Check } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { EDGE_FUNCTION_TEMPLATES } from 'components/interfaces/Functions/Functions.templates'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import FileExplorerAndEditor from 'components/ui/FileExplorerAndEditor/FileExplorerAndEditor'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useOrgAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import {
  AiIconAnimation,
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

// Array of adjectives and nouns for random function name generation
const ADJECTIVES = [
  'quick',
  'clever',
  'bright',
  'swift',
  'rapid',
  'smart',
  'smooth',
  'dynamic',
  'super',
  'hyper',
]
const NOUNS = [
  'function',
  'handler',
  'processor',
  'responder',
  'worker',
  'service',
  'api',
  'endpoint',
  'action',
  'task',
]

// Function name validation regex - only allows alphanumeric characters, hyphens, and underscores
const FUNCTION_NAME_REGEX = /^[A-Za-z0-9_-]+$/

// Define form schema with yup
const FormSchema = z.object({
  functionName: z
    .string()
    .min(1, 'Function name is required')
    .regex(FUNCTION_NAME_REGEX, 'Only letters, numbers, hyphens, and underscores allowed'),
})

// Generate a random function name
const generateRandomFunctionName = () => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${adjective}-${noun}`
}

// Convert invalid function name to valid one
const sanitizeFunctionName = (name: string): string => {
  // Replace invalid characters with hyphens
  return name.replace(/[^A-Za-z0-9_-]/g, '-')
}

// Type for the form values
type FormValues = z.infer<typeof FormSchema>

const NewFunctionPage = () => {
  const router = useRouter()
  const { ref, template } = useParams()
  const project = useSelectedProject()
  const { includeSchemaMetadata } = useOrgAiOptInLevel()
  const snap = useAiAssistantStateSnapshot()
  const { mutate: sendEvent } = useSendEventMutation()
  const org = useSelectedOrganization()

  const [files, setFiles] = useState<
    { id: number; name: string; content: string; selected?: boolean }[]
  >([
    {
      id: 1,
      name: 'index.ts',
      selected: true,
      content: EDGE_FUNCTION_TEMPLATES[0].content,
    },
  ])
  const [open, setOpen] = useState(false)
  const [isPreviewingTemplate, setIsPreviewingTemplate] = useState(false)
  const [savedCode, setSavedCode] = useState<string>('')

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      functionName: generateRandomFunctionName(),
    },
  })

  const { mutate: deployFunction, isLoading: isDeploying } = useEdgeFunctionDeployMutation({
    // [Joshen] To investigate: For some reason, the invalidation for list of edge functions isn't triggering
    onSuccess: () => {
      toast.success('Successfully deployed edge function')
      const functionName = form.getValues('functionName')
      if (ref && functionName) {
        router.push(`/project/${ref}/functions/${functionName}/details`)
      }
    },
  })

  const onSubmit = (values: FormValues) => {
    if (isDeploying || !ref) return

    deployFunction({
      projectRef: ref,
      slug: values.functionName,
      metadata: {
        entrypoint_path: 'index.ts',
        name: values.functionName,
        verify_jwt: true,
      },
      files: files.map(({ name, content }) => ({ name, content })),
    })
    sendEvent({
      action: 'edge_function_deploy_button_clicked',
      properties: { origin: 'functions_editor' },
      groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
  }

  const handleChat = () => {
    const selectedFile = files.find((f) => f.selected) ?? files[0]
    snap.newChat({
      name: 'Explain edge function',
      open: true,
      sqlSnippets: [selectedFile.content],
      initialInput: 'Help me understand and improve this edge function...',
      suggestions: {
        title:
          'I can help you understand and improve your edge function. Here are a few example prompts to get you started:',
        prompts: [
          {
            label: 'Explain Function',
            description: 'Explain what this function does...',
          },
          {
            label: 'Optimize Function',
            description: 'Help me optimize this function...',
          },
          {
            label: 'Add Features',
            description: 'Show me how to add more features...',
          },
          {
            label: 'Error Handling',
            description: 'Help me handle errors better...',
          },
        ],
      },
    })
    sendEvent({
      action: 'edge_function_ai_assistant_button_clicked',
      properties: { origin: 'functions_editor_chat' },
      groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
  }

  const onSelectTemplate = (templateValue: string) => {
    const template = EDGE_FUNCTION_TEMPLATES.find((t) => t.value === templateValue)
    if (template) {
      setFiles((prev) =>
        prev.map((file) => (file.selected ? { ...file, content: template.content } : file))
      )
      setOpen(false)
      sendEvent({
        action: 'edge_function_template_clicked',
        properties: { templateName: template.name, origin: 'editor_page' },
        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })
    }
  }

  const handleTemplateMouseEnter = (content: string) => {
    if (!isPreviewingTemplate) {
      const selectedFile = files.find((f) => f.selected) ?? files[0]
      setSavedCode(selectedFile.content)
    }
    setIsPreviewingTemplate(true)
    setFiles((prev) => prev.map((file) => (file.selected ? { ...file, content } : file)))
  }

  const handleTemplateMouseLeave = () => {
    if (isPreviewingTemplate) {
      setIsPreviewingTemplate(false)
      setFiles((prev) =>
        prev.map((file) => (file.selected ? { ...file, content: savedCode } : file))
      )
    }
  }

  // Try to sanitize function name when it's invalid
  const handleDeploy = () => {
    const currentName = form.getValues('functionName')
    const isValid = FUNCTION_NAME_REGEX.test(currentName)

    if (!isValid && currentName) {
      const sanitizedName = sanitizeFunctionName(currentName)
      form.setValue('functionName', sanitizedName, { shouldValidate: true })
    }

    form.handleSubmit(onSubmit)()
  }

  useEffect(() => {
    if (template) {
      const templateMeta = EDGE_FUNCTION_TEMPLATES.find((x) => x.value === template)
      if (templateMeta) {
        form.reset({ functionName: template })
        setFiles([
          {
            id: 1,
            name: 'index.ts',
            selected: true,
            content: templateMeta.content,
          },
        ])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template])

  return (
    <PageLayout
      size="full"
      isCompact
      title="Create new edge function"
      breadcrumbs={[
        {
          label: 'Edge Functions',
          href: `/project/${ref}/functions`,
        },
      ]}
      primaryActions={
        <>
          <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
            <PopoverTrigger_Shadcn_ asChild>
              <Button
                size="tiny"
                type="default"
                role="combobox"
                aria-expanded={open}
                icon={<Book size={14} />}
              >
                Templates
              </Button>
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_ portal className="w-[300px] p-0" align="end">
              <Command_Shadcn_>
                <CommandInput_Shadcn_ placeholder="Search templates..." />
                <CommandList_Shadcn_>
                  <CommandEmpty_Shadcn_>No templates found.</CommandEmpty_Shadcn_>
                  <CommandGroup_Shadcn_>
                    {EDGE_FUNCTION_TEMPLATES.map((template) => (
                      <CommandItem_Shadcn_
                        key={template.value}
                        value={template.value}
                        onSelect={onSelectTemplate}
                        onMouseEnter={() => handleTemplateMouseEnter(template.content)}
                        onMouseLeave={handleTemplateMouseLeave}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center">
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                files.some((f) => f.selected && f.content === template.content)
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <span className="text-foreground">{template.name}</span>
                          </div>
                          <span className="text-xs text-foreground-light pl-6">
                            {template.description}
                          </span>
                        </div>
                      </CommandItem_Shadcn_>
                    ))}
                  </CommandGroup_Shadcn_>
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
          <Button
            size="tiny"
            type="default"
            onClick={handleChat}
            icon={<AiIconAnimation size={16} />}
          >
            Chat
          </Button>
        </>
      }
    >
      <FileExplorerAndEditor
        files={files}
        onFilesChange={setFiles}
        aiEndpoint={`${BASE_PATH}/api/ai/edge-function/complete-v2`}
        aiMetadata={{
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          includeSchemaMetadata,
        }}
      />

      <Form_Shadcn_ {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex items-center bg-background-muted justify-end p-4 border-t bg-surface-100 gap-3"
        >
          <div className="flex items-center gap-3">
            <Label_Shadcn_ htmlFor="functionName">Function name</Label_Shadcn_>
            <FormField_Shadcn_
              control={form.control}
              name="functionName"
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-col gap-0 m-0">
                  <div className="flex items-center">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="functionName"
                        type="text"
                        size={'large'}
                        placeholder="Give your function a name..."
                        className="w-[250px]"
                        {...field}
                      />
                    </FormControl_Shadcn_>
                    {form.formState.errors.functionName && (
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="w-4 h-4 text-destructive ml-2" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {form.formState.errors.functionName.message}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </FormItem_Shadcn_>
              )}
            />
          </div>
          <Button
            loading={isDeploying}
            size="medium"
            disabled={files.length === 0 || isDeploying}
            onClick={handleDeploy}
          >
            Deploy function
          </Button>
        </form>
      </Form_Shadcn_>
    </PageLayout>
  )
}

NewFunctionPage.getLayout = (page: React.ReactNode) => {
  return (
    <DefaultLayout>
      <EdgeFunctionsLayout>{page}</EdgeFunctionsLayout>
    </DefaultLayout>
  )
}

export default NewFunctionPage
