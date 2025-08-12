import { common, dirname, relative } from '@std/path/posix'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertCircle, CornerDownLeft, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { DeployEdgeFunctionWarningModal } from 'components/interfaces/EdgeFunctions/DeployEdgeFunctionWarningModal'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import FileExplorerAndEditor from 'components/ui/FileExplorerAndEditor/FileExplorerAndEditor'
import { useEdgeFunctionBodyQuery } from 'data/edge-functions/edge-function-body-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useOrgAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { LogoLoader } from 'ui'

const CodePage = () => {
  const { ref, functionSlug } = useParams()
  const project = useSelectedProject()
  const { includeSchemaMetadata } = useOrgAiOptInLevel()

  const { mutate: sendEvent } = useSendEventMutation()
  const org = useSelectedOrganization()
  const [showDeployWarning, setShowDeployWarning] = useState(false)

  const canDeployFunction = useCheckPermissions(PermissionAction.FUNCTIONS_WRITE, '*')

  const { data: selectedFunction } = useEdgeFunctionQuery({ projectRef: ref, slug: functionSlug })
  const {
    data: functionFiles,
    isLoading: isLoadingFiles,
    isError: isErrorLoadingFiles,
    isSuccess: isSuccessLoadingFiles,
    error: filesError,
  } = useEdgeFunctionBodyQuery(
    {
      projectRef: ref,
      slug: functionSlug,
    },
    {
      // [Alaister]: These parameters prevent the function files
      // from being refetched when the user is editing the code
      retry: false,
      retryOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
    }
  )
  const [files, setFiles] = useState<
    { id: number; name: string; content: string; selected?: boolean }[]
  >([])

  const { mutate: deployFunction, isLoading: isDeploying } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      toast.success('Successfully updated edge function')
      setShowDeployWarning(false)
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

      deployFunction({
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

  function getBasePath(entrypoint: string | undefined): string {
    if (!entrypoint) {
      return '/'
    }

    try {
      return dirname(new URL(entrypoint).pathname)
    } catch (e) {
      console.error('Failed to parse entrypoint', entrypoint)
      return '/'
    }
  }

  const handleDeployClick = () => {
    if (files.length === 0 || isLoadingFiles) return
    setShowDeployWarning(true)
    sendEvent({
      action: 'edge_function_deploy_updates_button_clicked',
      groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
  }

  const handleDeployConfirm = () => {
    sendEvent({
      action: 'edge_function_deploy_updates_confirm_clicked',
      groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
    onUpdate()
  }

  useEffect(() => {
    // Set files from API response when available
    if (selectedFunction?.entrypoint_path && functionFiles) {
      const base_path = getBasePath(selectedFunction?.entrypoint_path)
      const filesWithRelPath = functionFiles
        // ignore empty files
        .filter((file: { name: string; content: string }) => !!file.content.length)
        // set file paths relative to entrypoint
        .map((file: { name: string; content: string }) => {
          try {
            // if the current file and base path doesn't share a common path,
            // return unmodified file
            const common_path = common([base_path, file.name])
            if (common_path === '' || common_path === '/tmp/') {
              return file
            }

            file.name = relative(base_path, file.name)
            return file
          } catch (e) {
            console.error(e)
            // return unmodified file
            return file
          }
        })

      setFiles((prev) => {
        return filesWithRelPath.map((file: { name: string; content: string }, index: number) => {
          const prevState = prev.find((x) => x.name === file.name)
          return {
            id: index + 1,
            name: file.name,
            content: file.content,
            selected: prevState?.selected ?? index === 0,
          }
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [functionFiles])

  return (
    <div className="flex flex-col h-full">
      {isLoadingFiles && (
        <div className="flex flex-col items-center justify-center h-full bg-surface-200">
          <LogoLoader />
        </div>
      )}

      {isErrorLoadingFiles && (
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
      )}

      {isSuccessLoadingFiles && (
        <>
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
          <div className="flex items-center bg-background-muted justify-end p-4 border-t bg-surface-100 shrink-0">
            <ButtonTooltip
              loading={isDeploying}
              size="medium"
              disabled={!canDeployFunction || files.length === 0 || isLoadingFiles}
              onClick={handleDeployClick}
              iconRight={
                isDeploying ? (
                  <Loader2 className="animate-spin" size={10} strokeWidth={1.5} />
                ) : (
                  <div className="flex items-center space-x-1">
                    <CornerDownLeft size={10} strokeWidth={1.5} />
                  </div>
                )
              }
              tooltip={{
                content: {
                  side: 'top',
                  text: !canDeployFunction
                    ? 'You need additional permissions to update edge functions'
                    : undefined,
                },
              }}
            >
              Deploy updates
            </ButtonTooltip>
          </div>
        </>
      )}

      <DeployEdgeFunctionWarningModal
        visible={showDeployWarning}
        onCancel={() => setShowDeployWarning(false)}
        onConfirm={handleDeployConfirm}
        isDeploying={isDeploying}
      />
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
