import { AlertCircle, CornerDownLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import LogoLoader from '@ui/components/LogoLoader'
import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import FileExplorerAndEditor from 'components/ui/FileExplorerAndEditor/FileExplorerAndEditor'
import { useEdgeFunctionBodyQuery } from 'data/edge-functions/edge-function-body-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { Button } from 'ui'

const CodePage = () => {
  const router = useRouter()
  const { ref, functionSlug } = useParams()
  const project = useSelectedProject()
  const isOptedInToAI = useOrgOptedIntoAi()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM
  const edgeFunctionCreate = useFlag('edgeFunctionCreate')
  const { mutate: sendEvent } = useSendEventMutation()
  const org = useSelectedOrganization()

  const { data: selectedFunction } = useEdgeFunctionQuery({ projectRef: ref, slug: functionSlug })
  const {
    data: functionFiles,
    isLoading: isLoadingFiles,
    isError: isErrorLoadingFiles,
    error: filesError,
  } = useEdgeFunctionBodyQuery({
    projectRef: ref,
    slug: functionSlug,
  })
  const [files, setFiles] = useState<
    { id: number; name: string; content: string; selected?: boolean }[]
  >([])

  const { mutateAsync: deployFunction, isLoading: isDeploying } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      toast.success('Successfully updated edge function')
    },
  })

  const onUpdate = async () => {
    if (isDeploying || !ref || !functionSlug || !selectedFunction || files.length === 0) return

    try {
      const parsedEntrypointPath =
        selectedFunction.entrypoint_path?.replace(/\/tmp\/user_fn_[^/]+\//, '') || 'index.ts'
      const existingFile = files.find((file) => file.name === parsedEntrypointPath) ||
        files.find((file) => file.name.endsWith('.ts') || file.name.endsWith('.js')) || {
          name: 'index.ts',
        }

      await deployFunction({
        projectRef: ref,
        slug: selectedFunction.slug,
        metadata: {
          name: selectedFunction.name,
          verify_jwt: selectedFunction.verify_jwt,
          entrypoint_path: existingFile.name,
          import_map_path: selectedFunction.import_map_path,
        },
        files: files.map(({ name, content }) => ({ name, content })),
      })
    } catch (error) {
      toast.error(
        `Failed to update function: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const renderContent = () => {
    if (isLoadingFiles) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-surface-200">
          <LogoLoader />
        </div>
      )
    }

    if (isErrorLoadingFiles) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-surface-200">
          <div className="flex flex-col items-center text-center gap-2 max-w-md">
            <AlertCircle size={24} strokeWidth={1.5} className="text-amber-900" />
            <h3 className="text-md mt-4">Failed to load function code</h3>
            <p className="text-sm text-foreground-light">
              {filesError?.message ||
                'There was an error loading the function code. The format may be invalid or the function may be corrupted.'}
            </p>
          </div>
        </div>
      )
    }

    return (
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
    )
  }

  // TODO (Saxon): Remove this once the flag is fully launched
  useEffect(() => {
    if (!edgeFunctionCreate) {
      router.push(`/project/${ref}/functions`)
    }
  }, [edgeFunctionCreate, ref, router])

  useEffect(() => {
    // Set files from API response when available
    if (functionFiles) {
      setFiles(
        functionFiles.map((file: { name: string; content: string }, index: number) => ({
          id: index + 1,
          name: file.name,
          content: file.content,
          selected: index === 0,
        }))
      )
    }
  }, [functionFiles])

  return (
    <div className="flex flex-col h-full">
      {renderContent()}

      {!isErrorLoadingFiles && (
        <div className="flex items-center bg-background-muted justify-end p-4 border-t bg-surface-100 shrink-0">
          <Button
            loading={isDeploying}
            size="medium"
            disabled={files.length === 0 || isLoadingFiles}
            onClick={() => {
              onUpdate()
              sendEvent({
                action: 'edge_function_deploy_updates_button_clicked',
                groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
              })
            }}
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
      )}
    </div>
  )
}

CodePage.getLayout = (page: React.ReactNode) => {
  return (
    <DefaultLayout>
      <EdgeFunctionDetailsLayout>{page}</EdgeFunctionDetailsLayout>
    </DefaultLayout>
  )
}

export default CodePage
