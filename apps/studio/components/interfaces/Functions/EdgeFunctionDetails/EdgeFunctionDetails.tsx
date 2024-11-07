import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { ExternalLink, Maximize2, Minimize2, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useEdgeFunctionDeleteMutation } from 'data/edge-functions/edge-functions-delete-mutation'
import { useEdgeFunctionUpdateMutation } from 'data/edge-functions/edge-functions-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CriticalIcon,
  Form,
  Input,
  Modal,
  Toggle,
  cn,
} from 'ui'
import CommandRender from '../CommandRender'
import { generateCLICommands } from './EdgeFunctionDetails.utils'

const EdgeFunctionDetails = () => {
  const router = useRouter()
  const { ref: projectRef, functionSlug } = useParams()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })
  const { data: selectedFunction } = useEdgeFunctionQuery({ projectRef, slug: functionSlug })
  const { mutate: updateEdgeFunction, isLoading: isUpdating } = useEdgeFunctionUpdateMutation()
  const { mutate: deleteEdgeFunction, isLoading: isDeleting } = useEdgeFunctionDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted "${selectedFunction?.name}"`)
      router.push(`/project/${projectRef}/functions`)
    },
  })

  const formId = 'edge-function-update-form'
  const canUpdateEdgeFunction = useCheckPermissions(PermissionAction.FUNCTIONS_WRITE, '*')

  const { anonKey } = getAPIKeys(settings)
  const apiKey = anonKey?.api_key ?? '[YOUR ANON KEY]'

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint ?? ''
  const functionUrl =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain.hostname}/functions/v1/${selectedFunction?.slug}`
      : `${protocol}://${endpoint}/functions/v1/${selectedFunction?.slug}`

  const { managementCommands, secretCommands, invokeCommands } = generateCLICommands(
    selectedFunction,
    functionUrl,
    apiKey
  )

  const onUpdateFunction = async (values: any, { resetForm }: any) => {
    if (!projectRef) return console.error('Project ref is required')
    if (selectedFunction === undefined) return console.error('No edge function selected')

    updateEdgeFunction(
      {
        projectRef,
        slug: selectedFunction.slug,
        payload: values,
      },
      {
        onSuccess: () => {
          resetForm({ values, initialValues: values })
          toast.success(`Successfully updated edge function`)
        },
      }
    )
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
                      <Input id="name" name="name" label="Name" disabled={!canUpdateEdgeFunction} />
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
                        disabled={!canUpdateEdgeFunction}
                        label="Enforce JWT Verification"
                        descriptionText="Require a valid JWT in the authorization header when invoking the function"
                      />
                      <div className="space-y-1 border rounded border-default bg-surface-200 px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm">
                            Import maps are{' '}
                            <span className={cn(hasImportMap ? 'text-brand' : 'text-amber-900')}>
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
                          <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
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
                <Terminal size={18} strokeWidth={2} />
              </div>
              <h4>Command line access</h4>
            </div>
            <div className="cursor-pointer" onClick={() => setShowInstructions(!showInstructions)}>
              {showInstructions ? (
                <Minimize2 size={14} strokeWidth={1.5} />
              ) : (
                <Maximize2 size={14} strokeWidth={1.5} />
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
          <Alert_Shadcn_ variant="destructive">
            <CriticalIcon />
            <AlertTitle_Shadcn_>
              Once your function is deleted, it can no longer be restored
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Make sure you have made a backup if you want to restore your edge function
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-3">
              <ButtonTooltip
                type="danger"
                disabled={!canUpdateEdgeFunction}
                loading={selectedFunction?.id === undefined}
                onClick={() => setShowDeleteModal(true)}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canUpdateEdgeFunction
                      ? 'You need additional permissions to delete edge functions'
                      : undefined,
                  },
                }}
              >
                Delete edge function
              </ButtonTooltip>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
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
        <Modal.Content>
          <Alert_Shadcn_ variant="warning">
            <CriticalIcon />
            <AlertTitle_Shadcn_>This action cannot be undone</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Ensure that you have made a backup if you want to restore your edge function
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default EdgeFunctionDetails
