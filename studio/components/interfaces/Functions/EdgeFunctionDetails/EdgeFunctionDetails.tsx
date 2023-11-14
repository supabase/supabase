import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import { useParams } from 'common'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Form,
  IconExternalLink,
  IconMaximize2,
  IconMinimize2,
  IconTerminal,
  Input,
  Modal,
  Toggle,
} from 'ui'

import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import Panel from 'components/ui/Panel'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useEdgeFunctionDeleteMutation } from 'data/edge-functions/edge-functions-delete-mutation'
import { useEdgeFunctionUpdateMutation } from 'data/edge-functions/edge-functions-update-mutation'
import { useCheckPermissions, useStore } from 'hooks'
import CommandRender from '../CommandRender'
import { generateCLICommands } from './EdgeFunctionDetails.utils'

const EdgeFunctionDetails = () => {
  const router = useRouter()
  const { ui } = useStore()
  const { ref: projectRef, functionSlug } = useParams()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  const { data: settings } = useProjectApiQuery({ projectRef })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })
  const { data: selectedFunction } = useEdgeFunctionQuery({ projectRef, slug: functionSlug })
  const { mutateAsync: updateEdgeFunction, isLoading: isUpdating } = useEdgeFunctionUpdateMutation()
  const { mutate: deleteEdgeFunction, isLoading: isDeleting } = useEdgeFunctionDeleteMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted "${selectedFunction?.name}"`,
      })
      router.push(`/project/${projectRef}/functions`)
    },
  })

  const formId = 'edge-function-update-form'
  const canUpdateEdgeFunction = useCheckPermissions(PermissionAction.FUNCTIONS_WRITE, '*')

  // Get the API service
  const apiService = settings?.autoApiService
  const anonKey = apiService?.service_api_keys.find((x) => x.name === 'anon key')
    ? apiService.defaultApiKey
    : '[YOUR ANON KEY]'

  const endpoint = apiService?.app_config.endpoint ?? ''
  const functionUrl =
    customDomainData?.customDomain?.status === 'active'
      ? `${apiService?.protocol}://${customDomainData.customDomain.hostname}/functions/v1/${selectedFunction?.slug}`
      : `${apiService?.protocol}://${endpoint}/functions/v1/${selectedFunction?.slug}`

  const { managementCommands, secretCommands, invokeCommands } = generateCLICommands(
    selectedFunction,
    functionUrl,
    anonKey
  )

  const onUpdateFunction = async (values: any, { resetForm }: any) => {
    if (!projectRef) return console.error('Project ref is required')
    if (selectedFunction === undefined) return console.error('No edge function selected')

    try {
      await updateEdgeFunction({
        projectRef,
        slug: selectedFunction.slug,
        payload: values,
      })
      resetForm({ values, initialValues: values })
      ui.setNotification({ category: 'success', message: `Successfully updated edge function` })
    } catch (error) {}
  }

  const onConfirmDelete = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (selectedFunction === undefined) return console.error('No edge function selected')
    deleteEdgeFunction({ projectRef, slug: selectedFunction.slug })
  }

  const hasImportMap = useMemo(
    () => selectedFunction?.import_map || selectedFunction?.import_map_path,
    [selectedFunction]
  )

  return (
    <>
      <div className="space-y-4 pb-16">
        <Form id={formId} initialValues={{}} onSubmit={onUpdateFunction}>
          {({ handleReset, values, initialValues, resetForm }: any) => {
            const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

            // [Alaister] although this "technically" is breaking the rules of React hooks
            // it won't error because the hooks are always rendered in the same order
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useEffect(() => {
              if (selectedFunction !== undefined) {
                const formValues = {
                  name: selectedFunction?.name,
                  verify_jwt: selectedFunction?.verify_jwt,
                }
                resetForm({ values: formValues, initialValues: formValues })
              }
            }, [selectedFunction])

            return (
              <>
                <FormPanel
                  disabled={!canUpdateEdgeFunction}
                  footer={
                    <div className="flex py-4 px-8">
                      <FormActions
                        form={formId}
                        isSubmitting={isUpdating}
                        hasChanges={hasChanges}
                        handleReset={handleReset}
                        helper={
                          !canUpdateEdgeFunction
                            ? 'You need additional permissions to update this function'
                            : undefined
                        }
                      />
                    </div>
                  }
                >
                  <FormSection header={<FormSectionLabel>Function Details</FormSectionLabel>}>
                    <FormSectionContent loading={selectedFunction === undefined}>
                      <Input id="name" name="name" label="Name" />
                      <Input
                        disabled
                        id="slug"
                        name="slug"
                        label="Slug"
                        value={selectedFunction?.slug}
                      />
                      <Input disabled copy label="Endpoint URL" value={functionUrl} />
                      <Input disabled label="Region" value="All functions are deployed globally" />
                      <Input
                        disabled
                        label="Created at"
                        value={dayjs(selectedFunction?.created_at ?? 0).format(
                          'dddd, MMMM D, YYYY h:mm A'
                        )}
                      />
                      <Input
                        disabled
                        label="Last updated at"
                        value={dayjs(selectedFunction?.updated_at ?? 0).format(
                          'dddd, MMMM D, YYYY h:mm A'
                        )}
                      />
                      <Input disabled label="Deployments" value={selectedFunction?.version ?? 0} />
                    </FormSectionContent>
                  </FormSection>
                  <FormSection header={<FormSectionLabel>Function Configuration</FormSectionLabel>}>
                    <FormSectionContent loading={selectedFunction === undefined}>
                      <Toggle
                        id="verify_jwt"
                        name="verify_jwt"
                        label="Enforce JWT Verification"
                        descriptionText="Require a valid JWT in the authorization header when invoking the function"
                      />
                      <div className="space-y-1 border rounded border-default bg-surface-200 px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm">
                            Import maps are{' '}
                            <span className={clsx(hasImportMap ? 'text-brand' : 'text-amber-900')}>
                              {hasImportMap ? 'used' : 'not used'}
                            </span>{' '}
                            for this function
                          </p>
                        </div>
                        <p className="text-sm text-foreground-light">
                          Import maps allow the use of bare specifiers in functions instead of
                          explicit import URLs
                        </p>
                        <div className="!mt-4">
                          <Button
                            asChild
                            type="default"
                            icon={<IconExternalLink strokeWidth={1.5} />}
                          >
                            <Link
                              href="https://supabase.com/docs/guides/functions/import-maps"
                              target="_blank"
                              rel="noreferrer"
                            >
                              More about import maps
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </FormSectionContent>
                  </FormSection>
                </FormPanel>
              </>
            )
          }}
        </Form>

        <div
          className="space-y-6 rounded border bg-surface-100 px-6 py-4 drop-shadow-sm transition-all overflow-hidden"
          style={{ maxHeight: showInstructions ? 800 : 66 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded border bg-foreground p-2 text-background">
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

        <div className="!mt-8">
          <FormHeader title="Delete Edge Function" description="" />
          <Panel>
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
                      disabled={!canUpdateEdgeFunction}
                      loading={selectedFunction?.id === undefined}
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Delete edge function
                    </Button>
                  </Tooltip.Trigger>
                  {!canUpdateEdgeFunction && (
                    <Tooltip.Portal>
                      <Tooltip.Content side="bottom">
                        <Tooltip.Arrow className="radix-tooltip-arrow" />
                        <div
                          className={[
                            'rounded bg-alternative py-1 px-2 leading-none shadow',
                            'border border-background',
                          ].join(' ')}
                        >
                          <span className="text-xs text-foreground">
                            You need additional permissions to delete an edge function
                          </span>
                        </div>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  )}
                </Tooltip.Root>
              </Alert>
            </Panel.Content>
          </Panel>
        </div>
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
