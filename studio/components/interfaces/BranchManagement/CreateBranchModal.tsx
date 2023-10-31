import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  IconCheck,
  IconExternalLink,
  IconLoader,
  Input_Shadcn_,
  Modal,
} from 'ui'
import * as z from 'zod'

import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useCheckGithubBranchValidity } from 'data/integrations/integrations-github-branch-check'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useSelectedOrganization, useSelectedProject } from 'hooks'

interface CreateBranchModalProps {
  visible: boolean
  onClose: () => void
}

const CreateBranchModal = ({ visible, onClose }: CreateBranchModalProps) => {
  const { ref } = useParams()
  const projectDetails = useSelectedProject()
  const selectedOrg = useSelectedOrganization()

  // [Joshen] There's something weird with RHF that I can't figure out atm
  // but calling form.formState.isValid somehow removes the onBlur check,
  // and makes the validation run onChange instead. This is a workaround
  const [isValid, setIsValid] = useState(false)

  const isBranch = projectDetails?.parent_project_ref !== undefined
  const projectRef =
    projectDetails !== undefined ? (isBranch ? projectDetails.parent_project_ref : ref) : undefined

  const {
    data: integrations,
    error: integrationsError,
    isLoading: isLoadingIntegrations,
    isSuccess: isSuccessIntegrations,
    isError: isErrorIntegrations,
  } = useOrgIntegrationsQuery({
    orgSlug: selectedOrg?.slug,
  })

  const { data: branches } = useBranchesQuery({ projectRef })
  const { mutateAsync: checkGithubBranchValidity, isLoading: isChecking } =
    useCheckGithubBranchValidity({
      onError: () => {},
    })

  const { mutate: createBranch, isLoading: isCreating } = useBranchCreateMutation({
    onSuccess: () => {
      toast.success('Successfully created new branch')
      onClose()
    },
  })

  const githubIntegration = integrations?.find(
    (integration) =>
      integration.integration.name === 'GitHub' &&
      integration.connections.some(
        (connection) => connection.supabase_project_ref === projectDetails?.parentRef
      )
  )
  const githubConnection = githubIntegration?.connections?.find(
    (connection) => connection.supabase_project_ref === projectDetails?.parentRef
  )
  const [repoOwner, repoName] = githubConnection?.metadata.name.split('/') || []

  const formId = 'create-branch-form'
  const FormSchema = z.object({
    branchName: z.string().superRefine(async (val, ctx) => {
      if ((branches ?? []).some((branch) => branch.git_branch === val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'This branch already has a Preview Branch',
        })
        return
      }

      if (val.length > 0) {
        try {
          await checkGithubBranchValidity({
            organizationIntegrationId: githubIntegration?.id,
            repoOwner,
            repoName,
            branchName: val,
          })
          setIsValid(true)
        } catch (error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unable to find branch from ${repoOwner}/${repoName}`,
          })
          setIsValid(false)
          return
        }
      }
    }),
  })
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { branchName: '' },
  })

  const canSubmit = form.getValues('branchName').length > 0 && !isChecking && isValid
  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')
    createBranch({ projectRef, branchName: data.branchName, gitBranch: data.branchName })
  }

  useEffect(() => {
    if (form && visible) {
      setIsValid(false)
      form.reset()
    }
  }, [form, visible])

  return (
    <Form_Shadcn_ {...form}>
      <form
        id={formId}
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
        onChange={() => setIsValid(false)}
      >
        <Modal
          hideFooter
          size="medium"
          modal={false}
          visible={visible}
          onCancel={onClose}
          header="Create a new preview branch"
          confirmText="Create Preview Branch"
        >
          <Modal.Content className="pt-3 pb-1">
            {isLoadingIntegrations && <GenericSkeletonLoader />}
            {isErrorIntegrations && (
              <AlertError
                error={integrationsError}
                subject="Failed to retrieve Github repository information"
              />
            )}
            {isSuccessIntegrations && (
              <div>
                <p className="text-sm text-foreground-light">
                  Your project is currently connected to the repository:
                </p>
                <div className="flex items-center space-x-2">
                  <p>{githubConnection?.metadata.name}</p>
                  <Link
                    href={`https://github.com/${repoOwner}/${repoName}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IconExternalLink size={14} strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            )}
          </Modal.Content>

          <Modal.Separator />

          <Modal.Content className="pt-1 pb-3 space-y-3">
            <p className="text-sm">
              Choose a Git Branch to base your Preview Branch on. Any migration changes added to
              this Git Branch will be run on this new Preview Branch.
            </p>
            <FormField_Shadcn_
              control={form.control}
              name="branchName"
              render={({ field }) => (
                <FormItem_Shadcn_ className="relative">
                  <label className="text-sm text-foreground-light">
                    Choose your branch to create a preview from
                  </label>
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} placeholder="e.g feat/some-feature" />
                  </FormControl_Shadcn_>
                  <div className="absolute top-9 right-3">
                    {isChecking ? (
                      <IconLoader className="animate-spin" />
                    ) : isValid ? (
                      <IconCheck className="text-brand" strokeWidth={2} />
                    ) : null}
                  </div>

                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
          </Modal.Content>

          <Modal.Separator />

          <Modal.Content>
            <div className="flex items-center justify-end space-x-2 py-2 pb-4">
              <Button disabled={isCreating} type="default" onClick={() => onClose()}>
                Cancel
              </Button>
              <Button
                form={formId}
                disabled={isCreating || !canSubmit}
                loading={isCreating}
                type="primary"
                htmlType="submit"
              >
                Create Preview branch
              </Button>
            </div>
          </Modal.Content>
        </Modal>
      </form>
    </Form_Shadcn_>
  )
}

export default CreateBranchModal
