import { useRef, useState, useEffect } from 'react'
import { CornerDownLeft, Loader2, Book, Check, ChevronsUpDown } from 'lucide-react'
import { Button, Input_Shadcn_, Label_Shadcn_, cn } from 'ui'
import { AiIconAnimation } from 'ui'
import AIEditor from 'components/ui/AIEditor'
import { BASE_PATH } from 'lib/constants'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { IS_PLATFORM } from 'lib/constants'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { toast } from 'sonner'
import { useRouter } from 'next/router'
import { useParams } from 'common'
import { useAppStateSnapshot } from 'state/app-state'
import DefaultLayout from 'components/layouts/DefaultLayout'
import FunctionsLayout from 'components/layouts/FunctionsLayout/FunctionsLayout'
import { PageLayout } from 'components/layouts/PageLayout'

const CodePage = () => {
  const router = useRouter()
  const { ref, functionSlug } = useParams()
  const project = useSelectedProject()
  const isOptedInToAI = useOrgOptedIntoAi()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM
  const { setAiAssistantPanel } = useAppStateSnapshot()

  const { data: selectedFunction } = useEdgeFunctionQuery({ projectRef: ref, slug: functionSlug })
  const [currentValue, setCurrentValue] = useState('')

  useEffect(() => {
    // Set initial code value when function is loaded
    if (selectedFunction) {
      // For now, we'll use a default template. In the future, we should fetch the actual code
      setCurrentValue(`// Setup type definitions for built-in Supabase Runtime APIs
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
});`)
    }
  }, [selectedFunction])

  const { mutateAsync: deployFunction, isLoading: isDeploying } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      toast.success('Successfully updated edge function')
      if (ref && functionSlug) {
        router.push(`/project/${ref}/functions/${functionSlug}/details`)
      }
    },
  })

  const handleChange = (value: string) => {
    setCurrentValue(value)
  }

  const onUpdate = async () => {
    if (!currentValue || isDeploying || !ref || !functionSlug || !selectedFunction) return

    try {
      await deployFunction({
        projectRef: ref,
        metadata: {
          name: selectedFunction.name,
          verify_jwt: selectedFunction.verify_jwt,
          entrypoint_path: 'index.ts',
        },
        files: [{ name: 'index.ts', content: currentValue }],
      })
    } catch (error) {
      toast.error(
        `Failed to update function: ${error instanceof Error ? error.message : 'Unknown error'}`
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
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 bg-surface-200">
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

      <div className="flex items-center bg-background-muted justify-end p-4 border-t bg-surface-100 shrink-0">
        <Button
          loading={isDeploying}
          size="medium"
          disabled={!currentValue}
          onClick={onUpdate}
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
          Deploy updates
        </Button>
      </div>
    </div>
  )
}

CodePage.getLayout = (page: React.ReactNode) => {
  return (
    <DefaultLayout>
      <FunctionsLayout>{page}</FunctionsLayout>
    </DefaultLayout>
  )
}

export default CodePage
