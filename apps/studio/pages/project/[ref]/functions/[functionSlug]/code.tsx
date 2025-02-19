import { useRef, useState, useEffect } from 'react'
import { CornerDownLeft, Loader2, Book, Check, ChevronsUpDown, Plus, File } from 'lucide-react'
import { Button, Input_Shadcn_, Label_Shadcn_, cn, TreeView, TreeViewItem, flattenTree } from 'ui'
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

const CodePage = () => {
  const router = useRouter()
  const { ref, functionSlug } = useParams()
  const project = useSelectedProject()
  const isOptedInToAI = useOrgOptedIntoAi()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM
  const { setAiAssistantPanel } = useAppStateSnapshot()

  const { data: selectedFunction } = useEdgeFunctionQuery({ projectRef: ref, slug: functionSlug })
  const [files, setFiles] = useState<{ id: number; name: string; content: string }[]>([])
  const [selectedFileId, setSelectedFileId] = useState<number>(1)

  useEffect(() => {
    // Set initial code value when function is loaded
    if (selectedFunction) {
      setFiles([
        {
          id: 1,
          name: 'index.ts',
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
      setSelectedFileId(1)
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
    setFiles((prev) =>
      prev.map((file) => (file.id === selectedFileId ? { ...file, content: value } : file))
    )
  }

  const onUpdate = async () => {
    if (isDeploying || !ref || !functionSlug || !selectedFunction || files.length === 0) return

    try {
      await deployFunction({
        projectRef: ref,
        metadata: {
          name: selectedFunction.name,
          verify_jwt: selectedFunction.verify_jwt,
          entrypoint_path: 'index.ts',
        },
        files: files.map(({ name, content }) => ({ name, content })),
      })
    } catch (error) {
      toast.error(
        `Failed to update function: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const handleChat = () => {
    const currentFile = files.find((f) => f.id === selectedFileId)
    setAiAssistantPanel({
      open: true,
      sqlSnippets: currentFile ? [currentFile.content] : [],
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

  const addNewFile = () => {
    const newId = Math.max(...files.map((f) => f.id)) + 1
    setFiles((prev) => [
      ...prev,
      {
        id: newId,
        name: `file${newId}.ts`,
        content: '',
      },
    ])
    setSelectedFileId(newId)
  }

  const handleFileNameChange = (id: number, newName: string) => {
    if (!newName.trim()) return // Don't allow empty names
    setFiles((prev) => prev.map((file) => (file.id === id ? { ...file, name: newName } : file)))
  }

  const handleDoubleClick = (id: number, currentName: string) => {
    const newName = prompt('Enter new file name:', currentName)
    if (newName && newName !== currentName) {
      handleFileNameChange(id, newName)
    }
  }

  const treeData = {
    name: '',
    children: files.map((file) => ({
      id: file.id.toString(),
      name: file.name,
      metadata: {
        isEditing: false,
        originalId: file.id,
      },
    })),
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex">
        <div className="w-64 border-r bg-surface-200 flex flex-col">
          <div className="py-4 px-6 border-b flex items-center justify-between">
            <h3 className="text-sm font-medium">Files</h3>
            <Button size="tiny" type="default" icon={<Plus size={14} />} onClick={addNewFile}>
              Add File
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <TreeView
              data={flattenTree(treeData)}
              aria-label="files tree"
              nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level }) => {
                const nodeProps = getNodeProps()
                const originalId =
                  typeof element.metadata?.originalId === 'number'
                    ? element.metadata.originalId
                    : null

                return (
                  <div
                    className="cursor-pointer"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      if (originalId !== null) handleDoubleClick(originalId, element.name)
                    }}
                  >
                    <TreeViewItem
                      {...nodeProps}
                      isExpanded={isExpanded}
                      isBranch={isBranch}
                      isSelected={originalId === selectedFileId}
                      level={level}
                      xPadding={16}
                      name={element.name}
                      icon={<File size={14} className="text-foreground-light" />}
                      isEditing={Boolean(element.metadata?.isEditing)}
                      onEditSubmit={(value) => {
                        if (originalId !== null) handleFileNameChange(originalId, value)
                      }}
                      onClick={() => {
                        if (originalId !== null) setSelectedFileId(originalId)
                      }}
                    />
                  </div>
                )
              }}
            />
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-surface-200">
          <AIEditor
            language={getLanguageFromFileName(
              files.find((f) => f.id === selectedFileId)?.name || 'index.ts'
            )}
            value={files.find((f) => f.id === selectedFileId)?.content}
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
      </div>

      <div className="flex items-center bg-background-muted justify-end p-4 border-t bg-surface-100 shrink-0">
        <Button
          loading={isDeploying}
          size="medium"
          disabled={files.length === 0}
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
