import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useParams } from 'common'
import { isEqual } from 'lodash'
import { AlertCircle, CornerDownLeft, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LogoLoader } from 'ui'

import { DeployEdgeFunctionWarningModal } from '@/components/interfaces/EdgeFunctions/DeployEdgeFunctionWarningModal'
import { formatFunctionBodyToFiles } from '@/components/interfaces/EdgeFunctions/EdgeFunctions.utils'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from '@/components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FileExplorerAndEditor } from '@/components/ui/FileExplorerAndEditor'
import { FileData } from '@/components/ui/FileExplorerAndEditor/FileExplorerAndEditor.types'
import { InlineLink } from '@/components/ui/InlineLink'
import { useEdgeFunctionBodyQuery } from '@/data/edge-functions/edge-function-body-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { useEdgeFunctionDeployMutation } from '@/data/edge-functions/edge-functions-deploy-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { usePreventNavigationOnUnsavedChanges } from '@/hooks/ui/usePreventNavigationOnUnsavedChanges'
import { BASE_PATH, DOCS_URL } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

const CodePage = () => {
  const { ref, functionSlug } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

  const track = useTrack()
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
    track('edge_function_deploy_updates_button_clicked')
  }

  const handleDeployConfirm = () => {
    track('edge_function_deploy_updates_confirm_clicked')
    onUpdate()
  }

  useEffect(() => {
    if (initialFiles.length === 0) return
    setFiles(initialFiles)
  }, [initialFiles])

  const hasUnsavedChanges = useMemo(() => {
    const normalizeFiles = (list: FileData[]) =>
      list.map(({ id, name, content }) => ({ id, name, content }))
    return !isEqual(normalizeFiles(initialFiles), normalizeFiles(files))
  }, [initialFiles, files])

  const { handleCancelNavigation, handleConfirmNavigation, shouldConfirmNavigation } =
    usePreventNavigationOnUnsavedChanges({
      hasChanges: hasUnsavedChanges,
    })

  return (
    <div className="flex flex-col h-full">
      {isLoadingFiles && (
        <div className="flex flex-col items-center justify-center h-full bg-surface-200">
          <LogoLoader />
        </div>
      )}

      {isErrorLoadingFiles && (
        <div className="flex flex-col items-center justify-center h-full bg-surface-200">
          <div className="flex flex-col items-center text-center gap-3 max-w-md">
            <AlertCircle size={24} strokeWidth={1.5} className="text-amber-900" />
            <h3 className="text-md mt-4">Failed to load function code</h3>
            <p className="text-sm text-foreground-light">
              {filesError?.message ||
                'There was an error loading the function code. The format may be invalid or the function may be corrupted.'}
            </p>
            <div className="text-sm text-foreground-light border-t border-border-muted pt-3 mt-2">
              <p className="font-medium mb-2">To resolve this issue:</p>
              <ol className="text-left space-y-1">
                <li>1. Update to the latest Supabase CLI version</li>
                <li>
                  2. Redeploy your function using:{' '}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    supabase functions deploy
                  </code>
                </li>
                <li>
                  3. Or use the{' '}
                  <InlineLink href={`${DOCS_URL}/reference/api/v1-deploy-a-function`}>
                    Management API
                  </InlineLink>
                </li>
              </ol>
            </div>
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
          {IS_PLATFORM && (
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
          )}
        </>
      )}

      <DeployEdgeFunctionWarningModal
        visible={showDeployWarning}
        onCancel={() => setShowDeployWarning(false)}
        onConfirm={handleDeployConfirm}
        isDeploying={isDeploying}
      />
      <DiscardChangesConfirmationDialog
        visible={shouldConfirmNavigation}
        onCancel={handleCancelNavigation}
        onClose={handleConfirmNavigation}
      />
    </div>
  )
}

CodePage.getLayout = (page: React.ReactNode) => {
  return (
    <DefaultLayout>
      <EdgeFunctionDetailsLayout title="Code">{page}</EdgeFunctionDetailsLayout>
    </DefaultLayout>
  )
}

export default CodePage
