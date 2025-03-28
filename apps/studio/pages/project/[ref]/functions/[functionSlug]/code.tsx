import { AlertCircle, CornerDownLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { useQueryClient } from '@tanstack/react-query'
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
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { Button } from 'ui'
import { edgeFunctionsKeys } from 'data/edge-functions/keys'

const CodePage = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { ref, functionSlug } = useParams()
  const project = useSelectedProject()
  const isOptedInToAI = useOrgOptedIntoAi()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM
  const edgeFunctionCreate = useFlag('edgeFunctionCreate')

  const { data: selectedFunction } = useEdgeFunctionQuery({ projectRef: ref, slug: functionSlug })
  const {
    data: functionFiles,
    isLoading: isLoadingFiles,
    isError: isErrorLoadingFiles,
    error: filesError,
  } = useEdgeFunctionBodyQuery({
    projectRef: ref,
    slug: functionSlug,
    entrypoint: selectedFunction?.entrypoint_path,
  })

  const [files, setFiles] = useState<
    { id: number; name: string; content: string; selected?: boolean }[]
  >([])

  const { mutateAsync: deployFunction, isLoading: isDeploying } = useEdgeFunctionDeployMutation({
    onSuccess: async () => {
      // refresh edge function
      toast.success('Successfully updated edge function')
    },
  })

  const onUpdate = async () => {
    if (isDeploying || !ref || !functionSlug || !selectedFunction || files.length === 0) return

    try {
      const newEntrypointPath = selectedFunction.entrypoint_path?.split('/').pop()
      const newImportMapPath = selectedFunction.import_map_path?.split('/').pop()

      const fallbackEntrypointPath = () => {
        // when there's no matching entrypoint path is set,
        // we use few heuristics to find an entrypoint file
        // 1. If the function has only a single TS / JS file, if so set it as entrypoint
        const jsFiles = files.filter(({ name }) => name.endsWith('.js') || name.endsWith('.ts'))
        if (jsFiles.length === 1) {
          return jsFiles[0].name
        } else if (jsFiles.length) {
          // 2. If function has a `index` or `main` file use it as the entrypoint
          const regex = /^.*?(index|main).*$/i
          const matchingFile = jsFiles.find(({ name }) => regex.test(name))
          // 3. if no valid index / main file found, we set the entrypoint expliclty to first JS file
          return matchingFile ? matchingFile.name : jsFiles[0].name
        } else {
          // no potential entrypoint files found, this will most likely result in an error on deploy
          return 'index.ts'
        }
      }

      const fallbackImportMapPath = () => {
        // try to find a deno.json or import_map.json file
        const regex = /^.*?(deno|import_map).json*$/i
        return files.find(({ name }) => regex.test(name))?.name
      }

      await deployFunction({
        projectRef: ref,
        slug: selectedFunction.slug,
        metadata: {
          name: selectedFunction.name,
          verify_jwt: selectedFunction.verify_jwt,
          entrypoint_path: files.some(({ name }) => name === newEntrypointPath)
            ? (newEntrypointPath as string)
            : fallbackEntrypointPath(),
          import_map_path: files.some(({ name }) => name === newImportMapPath)
            ? newImportMapPath
            : fallbackImportMapPath(),
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
