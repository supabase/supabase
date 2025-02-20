import { useState, useEffect } from 'react'
import { CornerDownLeft, Loader2 } from 'lucide-react'
import { Button } from 'ui'
import { BASE_PATH } from 'lib/constants'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { IS_PLATFORM } from 'lib/constants'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useEdgeFunctionBodyQuery } from 'data/edge-functions/edge-function-body-query'
import { toast } from 'sonner'
import { useRouter } from 'next/router'
import { useParams } from 'common'
import { useAppStateSnapshot } from 'state/app-state'
import DefaultLayout from 'components/layouts/DefaultLayout'
import FunctionsLayout from 'components/layouts/FunctionsLayout/FunctionsLayout'
import FileExplorerAndEditor from 'components/ui/FileExplorerAndEditor/FileExplorerAndEditor'
import { useFlag } from 'hooks/ui/useFlag'

const CodePage = () => {
  const router = useRouter()
  const { ref, functionSlug } = useParams()
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

  const { data: selectedFunction } = useEdgeFunctionQuery({ projectRef: ref, slug: functionSlug })
  const { data: functionFiles } = useEdgeFunctionBodyQuery({ projectRef: ref, slug: functionSlug })
  const [files, setFiles] = useState<
    { id: number; name: string; content: string; selected?: boolean }[]
  >([])

  useEffect(() => {
    // Set files from API response when available
    if (functionFiles) {
      setFiles(
        functionFiles.map((file, index) => ({
          id: index + 1,
          name: file.name,
          content: file.content,
          selected: index === 0,
        }))
      )
    }
  }, [functionFiles])

  const { mutateAsync: deployFunction, isLoading: isDeploying } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      toast.success('Successfully updated edge function')
      if (ref && functionSlug) {
        router.push(`/project/${ref}/functions/${functionSlug}/details`)
      }
    },
  })

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

  return (
    <div className="flex flex-col h-full">
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
