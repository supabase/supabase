import { PermissionAction } from '@supabase/shared-types/out/constants'
import { isEqual } from 'lodash'
import { AlertCircle, CornerDownLeft, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { formatFunctionBodyToFiles } from '@/components/interfaces/EdgeFunctions/EdgeFunctions.utils'
import { FileData } from '@/components/ui/FileExplorerAndEditor/FileExplorerAndEditor.types'
import { useLatest } from '@/hooks/misc/useLatest'
import { useParams } from 'common'
import { DeployEdgeFunctionWarningModal } from 'components/interfaces/EdgeFunctions/DeployEdgeFunctionWarningModal'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FileExplorerAndEditor } from 'components/ui/FileExplorerAndEditor'
import { useEdgeFunctionBodyQuery } from 'data/edge-functions/edge-function-body-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { LogoLoader } from 'ui'

const CodePage = () => {
  const { ref, functionSlug } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

  const { mutate: sendEvent } = useSendEventMutation()
  const [showDeployWarning, setShowDeployWarning] = useState(false)

  const { can: canDeployFunction } = useAsyncCheckPermissions(PermissionAction.FUNCTIONS_WRITE, '*')

  const { data: selectedFunction } = useEdgeFunctionQuery({
    projectRef: ref,
    slug: functionSlug,
  })
  const {
    data: functionBody,
    isPending: isLoadingFiles,
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
  const [files, setFiles] = useState<FileData[]>([])

  const initialFiles = useMemo(() => {
    return !!functionBody
      ? formatFunctionBodyToFiles({
          functionBody,
          entrypointPath: selectedFunction?.entrypoint_path,
        })
      : []
  }, [functionBody, selectedFunction?.entrypoint_path])

  const { mutate: deployFunction, isPending: isDeploying } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      toast.success('Successfully updated edge function')
      setShowDeployWarning(false)
      setFiles((files) =>
        files.map((f) => {
          return { ...f, state: 'unchanged' }
        })
      )
    },
  })

  const fileExists = (filePath: string | undefined): boolean => {
    return filePath ? files.some((file) => file.name === filePath) : false
  }

  const onUpdate = async () => {
    if (isDeploying || !ref || !functionSlug || !selectedFunction || files.length === 0) return

    try {
      const entrypoint_path =
        functionBody?.metadata?.deno2_entrypoint_path ?? selectedFunction.entrypoint_path
      const newEntrypointPath = entrypoint_path?.split('/').pop()
      const newImportMapPath = selectedFunction.import_map_path?.split('/').pop()

      const entrypointExists = fileExists(newEntrypointPath)
      const importMapExists = fileExists(newImportMapPath)

      deployFunction({
        projectRef: ref,
        slug: selectedFunction.slug,
        metadata: {
          name: selectedFunction.name,
          verify_jwt: selectedFunction.verify_jwt,
          ...(entrypointExists && { entrypoint_path: newEntrypointPath }),
          ...(importMapExists && { import_map_path: newImportMapPath }),
        },
        files: files.map(({ name, content }) => ({ name, content })),
      })
    } catch (error) {
      toast.error(
        `Failed to update function: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const handleDeployClick = () => {
    if (files.length === 0 || isLoadingFiles) return
    setShowDeployWarning(true)
    sendEvent({
      action: 'edge_function_deploy_updates_button_clicked',
      groups: {
        project: ref ?? 'Unknown',
        organization: org?.slug ?? 'Unknown',
      },
    })
  }

  const handleDeployConfirm = () => {
    sendEvent({
      action: 'edge_function_deploy_updates_confirm_clicked',
      groups: {
        project: ref ?? 'Unknown',
        organization: org?.slug ?? 'Unknown',
      },
    })
    onUpdate()
  }

  useEffect(() => {
    if (initialFiles.length === 0) return
    setFiles(initialFiles)
  }, [initialFiles])

  // [Joshen] Probably a candidate for useStaticEffectEvent
  const filesRef = useLatest(files)
  const initialFilesRef = useLatest(initialFiles)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const normalizeFiles = (list: FileData[]) =>
        list.map(({ id, name, content }) => ({ id, name, content }))
      const hasUnsavedChanges = !isEqual(
        normalizeFiles(initialFilesRef.current),
        normalizeFiles(filesRef.current)
      )

      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '' // deprecated, but older browsers still require this
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            onFilesChange={(files) => {
              const formattedFiles: FileData[] = files.map((f) => {
                const originalFile = initialFiles.find((x) => x.id === f.id)
                if (!originalFile) {
                  return f
                } else if (originalFile.name !== f.name) {
                  return { ...f, state: 'new' }
                } else if (originalFile.content !== f.content) {
                  return { ...f, state: 'modified' }
                }
                return { ...f, state: 'unchanged' }
              })
              setFiles(formattedFiles)
            }}
            aiEndpoint={`${BASE_PATH}/api/ai/code/complete`}
            aiMetadata={{
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              orgSlug: org?.slug,
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
