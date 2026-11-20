import { createFileRoute } from '@tanstack/react-router'
import { IS_PLATFORM, useParams } from 'common'
import { isEqual } from 'lodash'
import { CornerDownLeftIcon, Loader2Icon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LogoLoader } from 'ui'

import { DeployEdgeFunctionWarningModal } from '@/components/interfaces/EdgeFunctions/DeployEdgeFunctionWarningModal'
import {
  formatFunctionBodyToFiles,
  getDefaultSelectedFileId,
} from '@/components/interfaces/EdgeFunctions/EdgeFunctions.utils'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FileExplorerAndEditor } from '@/components/ui/FileExplorerAndEditor'
import { FileData } from '@/components/ui/FileExplorerAndEditor/FileExplorerAndEditor.types'
import { InlineLink } from '@/components/ui/InlineLink'
import {
  isFunctionBodyMaxSizeError,
  useEdgeFunctionBodyQuery,
} from '@/data/edge-functions/edge-function-body-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { useEdgeFunctionDeployMutation } from '@/data/edge-functions/edge-functions-deploy-mutation'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { usePreventNavigationOnUnsavedChanges } from '@/hooks/ui/usePreventNavigationOnUnsavedChanges'
import { BASE_PATH, DOCS_URL } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

export const Route = createFileRoute('/project/$ref/functions/$functionSlug/code')({
  component: CodePage,
  staticData: {
    edgeFunctionDetailsTitle: 'Code',
  },
})

function CodePage() {
  const { ref, functionSlug } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

  const track = useTrack()
  const [showDeployWarning, setShowDeployWarning] = useState(false)

  const { can: canDeployFunction } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_WRITE
  )

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
  const isExceedMaxSize = isFunctionBodyMaxSizeError(filesError)

  const initialFiles = useMemo(() => {
    return !!functionBody
      ? formatFunctionBodyToFiles({
          functionBody,
          entrypointPath: selectedFunction?.entrypoint_path,
        })
      : []
  }, [functionBody, selectedFunction?.entrypoint_path])

  const [selectedFileId, setSelectedFileId] = useState<number>()
  const defaultSelectedFileId = getDefaultSelectedFileId(
    initialFiles,
    functionBody?.metadata?.deno2_entrypoint_path ?? selectedFunction?.entrypoint_path
  )

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
          <AlertError
            hideContactSupport
            className="max-w-xl"
            subject="Failed to load function code"
            description={
              filesError?.message ?? 'The format may be invalid or the function may be corrupted'
            }
          >
            <p className="mb-0!">To resolve this issue:</p>
            <ol className="mt-0!">
              <li>Update to the latest Supabase CLI version</li>
              {isExceedMaxSize ? (
                <li>
                  Download your function via the CLI with:
                  <br />
                  <code>supabase functions download {functionSlug}</code>
                </li>
              ) : (
                <li>
                  Redeploy your function using either:
                  <ul className="list-disc! mt-0!">
                    <li>
                      The CLI via: <code>supabase functions deploy {functionSlug}</code>
                    </li>
                    <li>
                      Or the{' '}
                      <InlineLink href={`${DOCS_URL}/reference/api/v1-deploy-a-function`}>
                        Management API
                      </InlineLink>
                    </li>
                  </ul>
                </li>
              )}
            </ol>
          </AlertError>
        </div>
      )}

      {isSuccessLoadingFiles && (
        <>
          <FileExplorerAndEditor
            files={files}
            selectedFileId={selectedFileId ?? defaultSelectedFileId}
            setSelectedFileId={setSelectedFileId}
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
                variant="primary"
                loading={isDeploying}
                size="medium"
                disabled={!canDeployFunction || files.length === 0 || isLoadingFiles}
                onClick={handleDeployClick}
                iconRight={
                  isDeploying ? (
                    <Loader2Icon className="animate-spin" size={10} strokeWidth={1.5} />
                  ) : (
                    <div className="flex items-center space-x-1">
                      <CornerDownLeftIcon size={10} strokeWidth={1.5} />
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
