import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { FC, useState, useEffect } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import {
  Alert,
  IconGlobe,
  IconTerminal,
  IconMinimize2,
  IconMaximize2,
  IconCheck,
  IconClipboard,
  Button,
  Modal,
} from 'ui'

import { useStore, useParams, checkPermissions } from 'hooks'
import Panel from 'components/ui/Panel'
import CommandRender from './CommandRender'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useEdgeFunctionDeleteMutation } from 'data/edge-functions/edge-functions-delete-mutation'

interface Props {}

// [Joshen] Next - additional configs: Verify jwt + import maps

const EdgeFunctionDetails: FC<Props> = () => {
  const router = useRouter()
  const { functions, ui } = useStore()
  const { ref: projectRef, id } = useParams()
  const [isCopied, setIsCopied] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [selectedFunction, setSelectedFunction] = useState<any>(null)

  const canDeleteEdgeFunction = checkPermissions(PermissionAction.FUNCTIONS_WRITE, '*')
  const { mutateAsync: deleteEdgeFunction, isLoading: isDeleting } = useEdgeFunctionDeleteMutation()

  useEffect(() => {
    setSelectedFunction(functions.byId(id))
  }, [functions.isLoaded, ui.selectedProject])

  const { data: settings } = useProjectApiQuery({ projectRef })

  // Get the API service
  const apiService = settings?.autoApiService
  const anonKey = apiService?.service_api_keys.find((x) => x.name === 'anon key')
    ? apiService.defaultApiKey
    : '[YOUR ANON KEY]'

  const endpoint = apiService?.app_config.endpoint ?? ''
  const endpointSections = endpoint.split('.')
  const functionsEndpoint = [
    ...endpointSections.slice(0, 1),
    'functions',
    ...endpointSections.slice(1),
  ].join('.')
  const functionUrl = `${apiService?.protocol}://${functionsEndpoint}/${selectedFunction?.slug}`

  const onConfirmDelete = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (selectedFunction === undefined) return console.error('No edge function selected')

    try {
      await deleteEdgeFunction({ projectRef, slug: selectedFunction.slug })
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted "${selectedFunction.name}"`,
      })
      router.push(`/project/${projectRef}/functions`)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete function: ${error.message}`,
      })
    }
  }

  const managementCommands: any = [
    {
      command: `supabase functions deploy ${selectedFunction?.slug}`,
      description: 'This will overwrite the deployed function with your new function',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> functions deploy{' '}
            {selectedFunction?.slug}
          </>
        )
      },
      comment: 'Deploy a new version',
    },
    {
      command: `supabase functions delete ${selectedFunction?.slug}`,
      description: 'This will remove the function and all the logs associated with it',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> functions delete{' '}
            {selectedFunction?.slug}
          </>
        )
      },
      comment: 'Delete the function',
    },
  ]

  const secretCommands: any = [
    {
      command: `supabase secrets list`,
      description: 'This will list all the secrets for your project',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> secrets list
          </>
        )
      },
      comment: 'View all secrets',
    },
    {
      command: `supabase secrets set NAME1=VALUE1 NAME2=VALUE2`,
      description: 'This will set secrets for your project',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> secrets set NAME1=VALUE1 NAME2=VALUE2
          </>
        )
      },
      comment: 'Set secrets for your project',
    },
    {
      command: `supabase secrets unset NAME1 NAME2 `,
      description: 'This will delete secrets for your project',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">supabase</span> secrets unset NAME1 NAME2
          </>
        )
      },
      comment: 'Unset secrets for your project',
    },
  ]

  const invokeCommands: any = [
    {
      command: `curl -L -X POST '${functionUrl}' -H 'Authorization: Bearer ${
        anonKey ?? '[YOUR ANON KEY]'
      }' --data '{"name":"Functions"}'`,
      description: 'Invokes the hello function',
      jsx: () => {
        return (
          <>
            <span className="text-brand-1100">curl</span> -L -X POST 'https://{functionsEndpoint}/
            {selectedFunction?.slug}' -H 'Authorization: Bearer [YOUR ANON KEY]'{' '}
            {`--data '{"name":"Functions"}'`}
          </>
        )
      },
      comment: 'Invoke your function',
    },
  ]

  return (
    <>
      <div className="space-y-8 pb-16">
        <div className="space-y-6 rounded border bg-scale-100 px-10 py-8 drop-shadow-sm dark:bg-scale-300">
          <div className="flex items-center">
            <p className="text-sm text-scale-1000 w-[130px]">Function Name</p>
            <p className="text-sm text-scale-1200">{selectedFunction?.name}</p>
          </div>

          <div className="flex items-center">
            <p className="text-sm text-scale-1000 w-[130px]">Endpoint URL</p>
            <p className="text-sm text-scale-1200">{functionUrl}</p>
            <button
              type="button"
              className="text-scale-900 hover:text-scale-1200 transition ml-2"
              onClick={(event: any) => {
                function onCopy(value: any) {
                  setIsCopied(true)
                  navigator.clipboard.writeText(value).then()
                  setTimeout(function () {
                    setIsCopied(false)
                  }, 3000)
                }
                event.stopPropagation()
                onCopy(functionUrl)
              }}
            >
              {isCopied ? (
                <div className="text-brand-900">
                  <IconCheck size={14} strokeWidth={3} />
                </div>
              ) : (
                <div className="relative">
                  <div className="block">
                    <IconClipboard size={14} strokeWidth={1.5} />
                  </div>
                </div>
              )}
            </button>
          </div>

          <div className="flex items-center">
            <p className="text-sm text-scale-1000 w-[130px]">Created At</p>
            <p className="text-sm text-scale-1200">
              {selectedFunction?.created_at &&
                dayjs(selectedFunction.created_at).format('dddd, MMMM D, YYYY h:mm A')}
            </p>
          </div>

          <div className="flex items-center">
            <p className="text-sm text-scale-1000 w-[130px]">Last Updated At</p>
            <p className="text-sm text-scale-1200">
              {selectedFunction?.updated_at &&
                dayjs(selectedFunction.updated_at).format('dddd, MMMM D, YYYY h:mm A')}
            </p>
          </div>

          <div className="flex items-center">
            <span className="text-sm text-scale-1000 w-[130px]">Deployments</span>
            <div className="text-sm text-scale-1200">{selectedFunction?.version}</div>
          </div>

          <div className="flex items-start">
            <span className="text-sm text-scale-1000 w-[130px]">Regions</span>
            <div className="col-span-2 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm text-scale-1200">
                <IconGlobe size={16} strokeWidth={1.5} />
                <span>Earth</span>
              </div>
              <span className="text-sm text-scale-1000">All functions are deployed globally</span>
            </div>
          </div>
        </div>

        <div
          className="space-y-6 rounded border bg-scale-100 px-8 py-6 drop-shadow-sm dark:bg-scale-300 transition-all overflow-hidden"
          style={{ maxHeight: showInstructions ? 800 : 80 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded border bg-scale-1200 p-2 text-scale-100 dark:bg-scale-100 dark:text-scale-1200">
                <IconTerminal strokeWidth={2} />
              </div>
              <h4>Command line access</h4>
            </div>
            <div className="cursor-pointer" onClick={() => setShowInstructions(!showInstructions)}>
              {showInstructions ? (
                <IconMinimize2 size={14} strokeWidth={1.5} />
              ) : (
                <IconMaximize2 size={14} strokeWidth={1.5} />
              )}
            </div>
          </div>

          <h5 className="text-base">Deployment management</h5>
          <CommandRender commands={managementCommands} />
          <h5 className="text-base">Invoke </h5>
          <CommandRender commands={invokeCommands} />
          <h5 className="text-base">Secrets management</h5>
          <CommandRender commands={secretCommands} />
        </div>

        <Panel title={<p>Delete Edge Function</p>}>
          <Panel.Content>
            <Alert
              withIcon
              variant="danger"
              title="Once your function is deleted, it can no longer be restored"
            >
              <p className="mb-3">
                Make sure you have made a backup if you want to restore your edge function
              </p>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Button
                    type="danger"
                    disabled={!canDeleteEdgeFunction}
                    loading={selectedFunction?.id === undefined}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete edge function
                  </Button>
                </Tooltip.Trigger>
                {!canDeleteEdgeFunction && (
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                        'border border-scale-200',
                      ].join(' ')}
                    >
                      <span className="text-xs text-scale-1200">
                        You need additional permissions to delete an edge function
                      </span>
                    </div>
                  </Tooltip.Content>
                )}
              </Tooltip.Root>
            </Alert>
          </Panel.Content>
        </Panel>
      </div>

      <Modal
        size="small"
        alignFooter="right"
        header={<h3>Confirm to delete {selectedFunction?.name}</h3>}
        visible={showDeleteModal}
        loading={isDeleting}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={onConfirmDelete}
      >
        <div className="py-6">
          <Modal.Content>
            <Alert withIcon variant="warning" title="This action cannot be undone">
              Ensure that you have made a backup if you want to restore your edge function
            </Alert>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default EdgeFunctionDetails
