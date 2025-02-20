import { useEffect, useState } from 'react'
import { CornerDownLeft, Loader2, Book, Check, ChevronsUpDown, Plus, File } from 'lucide-react'
import { Button, Input_Shadcn_, Label_Shadcn_, cn } from 'ui'
import { AiIconAnimation } from 'ui'
import { BASE_PATH } from 'lib/constants'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { IS_PLATFORM } from 'lib/constants'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import { toast } from 'sonner'
import { useRouter } from 'next/router'
import { useParams } from 'common'
import { useAppStateSnapshot } from 'state/app-state'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import FileExplorerAndEditor from 'components/ui/FileExplorerAndEditor/FileExplorerAndEditor'
import {
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'
import { useFlag } from 'hooks/ui/useFlag'

const EDGE_FUNCTION_TEMPLATES = [
  {
    value: 'hello-world',
    name: 'Simple Hello World',
    description: 'Basic function that returns a JSON response',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
interface reqPayload {
  name: string;
}

console.info('server started');

Deno.serve(async (req: Request) => {
  const { name }: reqPayload = await req.json();
  const data = {
    message: \`Hello \${name} from foo!\`,
  };

  return new Response(
    JSON.stringify(data),
    { headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }}
  );
});`,
  },
  {
    value: 'database-access',
    name: 'Supabase Database Access',
    description: 'Example using Supabase client to query your database',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data, error } = await supabase.from('countries').select('*')

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(String(err?.message ?? err), { status: 500 })
  }
})`,
  },
  {
    value: 'node-api',
    name: 'Node Built-in API Example',
    description: 'Example using Node.js built-in crypto and http modules',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import process from "node:process";

const generateRandomString = (length) => {
  const buffer = randomBytes(length);
  return buffer.toString('hex');
};

const randomString = generateRandomString(10);
console.log(randomString);

const server = createServer((req, res) => {
  const message = \`Hello\`;
  res.end(message);
});

server.listen(9999);`,
  },
  {
    value: 'express',
    name: 'Express Server',
    description: 'Example using Express.js for routing',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import express from "npm:express@4.18.2";

const app = express();

app.get(/(.*)/, (req, res) => {
  res.send("Welcome to Supabase");
});

app.listen(8000);`,
  },
]

interface TreeNode {
  id: string
  name: string
  metadata?: {
    isEditing?: boolean
    originalId: number
  }
  children?: TreeNode[]
}

interface TreeNodeRendererProps {
  element: TreeNode
  isBranch: boolean
  isExpanded: boolean
  isSelected: boolean
  level: number
  getNodeProps: () => React.HTMLAttributes<HTMLDivElement>
}

const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'json':
      return 'json'
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    case 'md':
      return 'markdown'
    default:
      return 'typescript' // Default to typescript
  }
}

const NewFunctionPage = () => {
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const isOptedInToAI = useOrgOptedIntoAi()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM
  const { setAiAssistantPanel } = useAppStateSnapshot()
  const edgeFunctionCreate = useFlag('edgeFunctionCreate')

  // TODO (Saxon): Remove this once the flag is fully launched
  useEffect(() => {
    if (!edgeFunctionCreate) {
      router.push(`/project/${ref}/functions`)
    }
  }, [edgeFunctionCreate, ref, router])

  const [files, setFiles] = useState<
    { id: number; name: string; content: string; selected?: boolean }[]
  >([
    {
      id: 1,
      name: 'index.ts',
      selected: true,
      content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.info('server started');

Deno.serve(async (req: Request) => {
  const data = {
    message: 'Hello from Supabase Edge Functions!',
  };

  return new Response(
    JSON.stringify(data),
    { headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }}
  );
});`,
    },
  ])
  const [functionName, setFunctionName] = useState('')
  const [open, setOpen] = useState(false)
  const [isPreviewingTemplate, setIsPreviewingTemplate] = useState(false)
  const [savedCode, setSavedCode] = useState<string>('')

  const { mutateAsync: deployFunction, isLoading: isDeploying } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      toast.success('Successfully deployed edge function')
      if (ref && functionName) {
        router.push(`/project/${ref}/functions/${functionName}/details`)
      }
    },
  })

  const onDeploy = async () => {
    if (isDeploying || !ref || !functionName) return

    try {
      await deployFunction({
        projectRef: ref,
        metadata: {
          entrypoint_path: 'index.ts',
          name: functionName,
          verify_jwt: true,
        },
        files: files.map(({ name, content }) => ({ name, content })),
      })
    } catch (error) {
      toast.error(
        `Failed to deploy function: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const handleChat = () => {
    const selectedFile = files.find((f) => f.selected) ?? files[0]
    setAiAssistantPanel({
      open: true,
      sqlSnippets: [selectedFile.content],
      initialInput: 'Help me understand and improve this edge function...',
      suggestions: {
        title:
          'I can help you understand and improve your edge function. Here are a few example prompts to get you started:',
        prompts: [
          'Explain what this function does...',
          'Help me optimize this function...',
          'Show me how to add more features...',
          'Help me handle errors better...',
        ],
      },
    })
  }

  const onSelectTemplate = (templateValue: string) => {
    const template = EDGE_FUNCTION_TEMPLATES.find((t) => t.value === templateValue)
    if (template) {
      setFiles((prev) =>
        prev.map((file) => (file.selected ? { ...file, content: template.content } : file))
      )
      setOpen(false)
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

  return (
    <PageLayout
      size="full"
      isCompact
      breadcrumbs={[
        {
          label: 'Edge Functions',
          href: `/project/${ref}/functions`,
        },
        {
          element: (
            <div className="flex items-center gap-2">
              <Label_Shadcn_ htmlFor="function-name" className="text-foreground-light sr-only">
                Function name
              </Label_Shadcn_>
              <Input_Shadcn_
                id="function-name"
                type="text"
                autoFocus
                placeholder="Give your function a name..."
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
                className="w-[400px] p-0 text-base text-foreground bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          ),
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
            <PopoverContent_Shadcn_ className="w-[300px] p-0">
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
        aiEndpoint={`${BASE_PATH}/api/ai/edge-function/complete`}
        aiMetadata={{
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          includeSchemaMetadata,
        }}
      />

      <div className="flex items-center bg-background-muted justify-end p-4 border-t bg-surface-100">
        <Button
          loading={isDeploying}
          size="medium"
          disabled={!functionName || files.length === 0}
          onClick={onDeploy}
          iconRight={
            isDeploying ? (
              <Loader2 className="animate-spin" size={10} strokeWidth={1.5} />
            ) : (
              <div className="flex items-center space-x-1">
                <CornerDownLeft size={10} strokeWidth={1.5} />
              </div>
            )
          }
        >
          Deploy function
        </Button>
      </div>
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
