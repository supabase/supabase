import { useRef, useState } from 'react'
import { CornerDownLeft, Loader2, X, Book } from 'lucide-react'
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  cn,
  Input_Shadcn_,
  SheetFooter,
} from 'ui'
import { AiIconAnimation } from 'ui'
import AIEditor from 'components/ui/AIEditor'
import { BASE_PATH } from 'lib/constants'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { IS_PLATFORM } from 'lib/constants'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import { toast } from 'sonner'
import { useRouter } from 'next/router'
import { useParams } from 'common'
import { useAppStateSnapshot } from 'state/app-state'

interface EdgeFunctionPanelProps {
  visible: boolean
  onClose: () => void
}

const EDGE_FUNCTION_TEMPLATES = [
  {
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

const EdgeFunctionPanel = ({ visible, onClose }: EdgeFunctionPanelProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const isOptedInToAI = useOrgOptedIntoAi()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM
  const { setAiAssistantPanel } = useAppStateSnapshot()

  const [currentValue, setCurrentValue] =
    useState(`import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log(\`Function "select-from-table-with-auth-rls" up and running!\`);

Deno.serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get("SUPABASE_URL")!,
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get("SUPABASE_ANON_KEY")!,
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // First get the token from the Authorization header
    const token = req.headers.get("Authorization").replace("Bearer ", "");

    // Now we can get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser(token);

    // And we can run queries in the context of our authenticated user
    const { data, error } = await supabaseClient.from("users").select("*");
    if (error) throw error;

    return new Response(JSON.stringify({ user, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});`)
  const [functionName, setFunctionName] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const [savedCode, setSavedCode] = useState<string>('')
  const [isPreviewingTemplate, setIsPreviewingTemplate] = useState(false)

  const { mutateAsync: deployFunction, isLoading: isDeploying } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      toast.success('Successfully deployed edge function')
      if (ref && functionName) {
        router.push(`/project/${ref}/functions/${functionName}/details`)
      }
      onClose()
    },
  })

  const handleChange = (value: string) => {
    setCurrentValue(value)
  }

  const onDeploy = async () => {
    if (!currentValue || isDeploying || !ref || !functionName) return

    try {
      await deployFunction({
        projectRef: ref,
        metadata: {
          entrypoint_path: 'index.ts',
          name: functionName,
          verify_jwt: true,
        },
        files: [{ name: 'index.ts', content: currentValue }],
      })
    } catch (error) {
      toast.error(
        `Failed to deploy function: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const handleChat = () => {
    setAiAssistantPanel({
      open: true,
      sqlSnippets: currentValue ? [currentValue] : [],
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
    onClose()
  }

  const onSelectTemplate = (content: string) => {
    handleChange(content)
    setSavedCode(content)
    setShowTemplates(false)
  }

  const handleTemplateMouseEnter = (templateContent: string) => {
    if (!isPreviewingTemplate) {
      setSavedCode(currentValue)
    }
    setIsPreviewingTemplate(true)
    handleChange(templateContent)
  }

  const handleTemplateMouseLeave = () => {
    if (isPreviewingTemplate) {
      setIsPreviewingTemplate(false)
      handleChange(savedCode)
    }
  }

  return (
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent showClose={false} size="lg" className="flex flex-col h-full p-0 gap-0">
        <SheetHeader className="py-3 px-5 flex justify-between items-center border-b">
          <SheetTitle className="text-sm">Create Edge Function</SheetTitle>
          <div className="flex gap-2 items-center">
            <Button
              size="tiny"
              type="default"
              className="h-7"
              onClick={handleChat}
              icon={<AiIconAnimation size={16} />}
            >
              Chat
            </Button>
            <Button
              size="tiny"
              type="default"
              className="w-7 h-7"
              onClick={onClose}
              icon={<X size={16} />}
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col h-full">
          <div className="flex-1 min-h-0 relative px-3 bg-surface-200">
            <AIEditor
              language="typescript"
              value={currentValue}
              onChange={handleChange}
              aiEndpoint={`${BASE_PATH}/api/ai/edge-function/complete`}
              aiMetadata={{
                projectRef: project?.ref,
                connectionString: project?.connectionString,
                includeSchemaMetadata,
              }}
              options={{
                tabSize: 2,
                fontSize: 12,
                minimap: { enabled: false },
                wordWrap: 'on',
                lineNumbers: 'on',
                folding: false,
                padding: { top: 20, bottom: 20 },
                lineNumbersMinChars: 3,
              }}
            />
          </div>

          {showTemplates && (
            <div className="bg-surface-100 border-t w-full flex flex-col max-h-80 h-full text-sm">
              <div className="px-4 py-3 border-b shrink-0">
                <Input_Shadcn_
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                />
              </div>
              <div className="overflow-auto flex-1 p-2">
                {EDGE_FUNCTION_TEMPLATES?.filter((template) => {
                  const searchLower = templateSearch.toLowerCase()
                  return (
                    template.name.toLowerCase().includes(searchLower) ||
                    template.description.toLowerCase().includes(searchLower)
                  )
                })?.map((template, i) => (
                  <div
                    key={i}
                    className="cursor-pointer group rounded-lg flex items-center gap-4 px-4 py-3 hover:bg-surface-200"
                    onClick={() => onSelectTemplate(template.content)}
                    onMouseEnter={() => handleTemplateMouseEnter(template.content)}
                    onMouseLeave={handleTemplateMouseLeave}
                  >
                    <div>
                      <p className="text-xs mb-1">{template.name}</p>
                      <p className="text-xs text-foreground-light">{template.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <SheetFooter className="shrink-0 gap-16">
            <Button
              size="tiny"
              type="default"
              onClick={() => setShowTemplates(!showTemplates)}
              icon={<Book size={14} />}
            >
              Templates
            </Button>
            <div className="flex-1 flex gap-2 items-stretch">
              <Input_Shadcn_
                type="text"
                size="tiny"
                placeholder="Function name"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
                className="flex-1"
              />
              <Button
                loading={isDeploying}
                disabled={!functionName || !currentValue}
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
                Deploy
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default EdgeFunctionPanel
