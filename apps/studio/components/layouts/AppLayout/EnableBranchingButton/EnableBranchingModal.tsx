import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form_Shadcn_,
  IconFileText,
  IconGitBranch,
  Modal,
} from 'ui'
import * as z from 'zod'

import SidePanelGitHubRepoLinker from 'components/interfaces/Organization/IntegrationSettings/SidePanelGitHubRepoLinker'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useCheckGithubBranchValidity } from 'data/integrations/integrations-github-branch-check'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useSelectedOrganization, useStore } from 'hooks'
import { useAppStateSnapshot } from 'state/app-state'
import GithubRepositorySelection from './GithubRepositorySelection'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { AlertCircleIcon } from 'lucide-react'
import Link from 'next/link'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'

const EnableBranchingModal = () => {
  const { ui } = useStore()
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const selectedOrg = useSelectedOrganization()

  // [Joshen] There's something weird with RHF that I can't figure out atm
  // but calling form.formState.isValid somehow removes the onBlur check,
  // and makes the validation run onChange instead. This is a workaround
  const [isValid, setIsValid] = useState(false)

  const {
    data: integrations,
    error: integrationsError,
    isLoading: isLoadingIntegrations,
    isSuccess: isSuccessIntegrations,
    isError: isErrorIntegrations,
  } = useOrgIntegrationsQuery({
    orgSlug: selectedOrg?.slug,
  })

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrg?.slug })
  const isFreePlan = subscription?.plan.id === 'free'

  const {
    data: addons,
    error: addonsError,
    isLoading: isLoadingAddons,
    isError: isErrorAddons,
  } = useProjectAddonsQuery({ projectRef: ref })
  const hasPitrEnabled =
    (addons?.selected_addons ?? []).find((addon) => addon.type === 'pitr') !== undefined

  const hasGithubIntegrationInstalled =
    integrations?.some((integration) => integration.integration.name === 'GitHub') ?? false
  const githubIntegration = integrations?.find(
    (integration) =>
      integration.integration.name === 'GitHub' &&
      integration.organization.slug === selectedOrg?.slug
  )
  const githubConnection = githubIntegration?.connections.find(
    (connection) => connection.supabase_project_ref === ref
  )
  const [repoOwner, repoName] = githubConnection?.metadata.name.split('/') ?? []

  const { mutateAsync: checkGithubBranchValidity, isLoading: isChecking } =
    useCheckGithubBranchValidity({ onError: () => {} })

  const { mutate: createBranch, isLoading: isCreating } = useBranchCreateMutation({
    onSuccess: () => {
      ui.setNotification({ category: 'success', message: `Successfully created new branch` })
      snap.setShowEnableBranchingModal(false)
    },
  })

  const formId = 'enable-branching-form'
  const FormSchema = z.object({
    branchName: z
      .string()
      .refine((val) => val.length > 1, `Please enter a branch name from ${repoOwner}/${repoName}`)
      .refine(async (val) => {
        try {
          if (val.length > 0) {
            await checkGithubBranchValidity({
              organizationIntegrationId: githubIntegration?.id,
              repoOwner,
              repoName,
              branchName: val,
            })
            setIsValid(true)
          }
          return true
        } catch (error) {
          setIsValid(false)
          return false
        }
      }, `Unable to find branch from ${repoOwner}/${repoName}`),
  })
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: { branchName: '' },
  })

  const canSubmit = form.getValues('branchName').length > 0 && !isChecking && isValid
  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!ref) return console.error('Project ref is required')
    createBranch({ projectRef: ref, branchName: data.branchName, gitBranch: data.branchName })
  }

  useEffect(() => {
    if (form && snap.showEnableBranchingModal) {
      setIsValid(false)
      form.reset()
    }
  }, [form, snap.showEnableBranchingModal])

  return (
    <>
      <Modal
        hideFooter
        visible={snap.showEnableBranchingModal}
        onCancel={() => snap.setShowEnableBranchingModal(false)}
        className="!bg"
        size="medium"
      >
        <Form_Shadcn_ {...form}>
          <form
            id={formId}
            onSubmit={form.handleSubmit(onSubmit)}
            onChange={() => setIsValid(false)}
          >
            <Modal.Content className="px-7 py-5 flex items-center space-x-4">
              <IconGitBranch strokeWidth={2} size={20} />
              <div>
                <p className="text-foreground">Enable database branching</p>
                <p className="text-sm text-foreground-light">Manage environments in Supabase</p>
              </div>
            </Modal.Content>

            {(isLoadingIntegrations || isLoadingAddons) && (
              <>
                <Modal.Separator />
                <Modal.Content className="px-7 py-6">
                  <GenericSkeletonLoader />
                </Modal.Content>
                <Modal.Separator />
              </>
            )}

            {isErrorAddons && (
              <>
                <Modal.Separator />
                <Modal.Content className="px-7 py-6">
                  <AlertError error={addonsError} subject="Failed to retrieve project addons" />
                </Modal.Content>
                <Modal.Separator />
              </>
            )}

            {hasPitrEnabled ? (
              <>
                {isErrorIntegrations && (
                  <>
                    <Modal.Separator />
                    <Modal.Content className="px-7 py-6">
                      <AlertError
                        error={integrationsError}
                        subject="Failed to retrieve integrations"
                      />
                    </Modal.Content>
                    <Modal.Separator />
                  </>
                )}

                {isSuccessIntegrations && (
                  <GithubRepositorySelection
                    form={form}
                    isChecking={isChecking}
                    isValid={canSubmit}
                    integration={githubIntegration}
                    hasGithubIntegrationInstalled={hasGithubIntegrationInstalled}
                  />
                )}

                <Modal.Content className="px-7 py-6 flex flex-col gap-3">
                  <p className="text-sm text-foreground-light">
                    Please keep in mind the following:
                  </p>
                  <div className="flex flex-row gap-4">
                    <div>
                      <figure className="w-10 h-10 rounded-md bg-warning-200 border border-warning-300 flex items-center justify-center">
                        <IconFileText className="text-amber-900" size={20} strokeWidth={2} />
                      </figure>
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        You will not be able to use the dashboard to make changes to the database
                      </p>
                      <p className="text-sm text-foreground-light">
                        Schema changes for database Preview Branches must be made using git.
                        Dashboard changes to Preview Branches are coming soon.
                      </p>
                    </div>
                  </div>
                </Modal.Content>

                <Modal.Separator />

                <Modal.Content className="px-7">
                  <div className="flex items-center space-x-2 py-2 pb-4">
                    <Button
                      size="medium"
                      block
                      disabled={isCreating}
                      type="default"
                      onClick={() => snap.setShowEnableBranchingModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      block
                      size="medium"
                      form={formId}
                      disabled={isCreating || !canSubmit}
                      loading={isCreating}
                      type="primary"
                      htmlType="submit"
                    >
                      I understand, enable branching
                    </Button>
                  </div>
                </Modal.Content>
              </>
            ) : (
              <div className="">
                <Alert_Shadcn_ className="rounded-none border-r-0 border-l-0 px-7 [&>svg]:left-6">
                  <AlertCircleIcon strokeWidth={2} />
                  <AlertTitle_Shadcn_>
                    Point in time recovery (PITR) is required for branching
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    This is to ensure that you can always recover data if you make a "bad
                    migration". For example, if you accidentally delete a column or some of your
                    production data.
                  </AlertDescription_Shadcn_>
                  {isFreePlan && (
                    <AlertDescription_Shadcn_ className="mt-2">
                      To enable PITR, you may first upgrade your organization's plan to at least
                      Pro, then purchase the PITR add on for your project via the{' '}
                      <Link
                        href={`/project/${ref}/settings/addons?panel=pitr`}
                        className="text-brand"
                      >
                        project settings
                      </Link>
                      .
                    </AlertDescription_Shadcn_>
                  )}
                </Alert_Shadcn_>
                <Modal.Content className="px-7">
                  <div className="flex items-center justify-end space-x-2 py-4 pb-4">
                    <Button
                      size="tiny"
                      type="default"
                      onClick={() => snap.setShowEnableBranchingModal(false)}
                    >
                      Understood
                    </Button>
                    <Button size="tiny">
                      <Link
                        href={
                          isFreePlan
                            ? `/org/${selectedOrg?.slug}/billing?panel=subscriptionPlan`
                            : `/project/${ref}/settings/addons?panel=pitr`
                        }
                      >
                        {isFreePlan ? 'Upgrade to Pro' : 'Enable PITR'}
                      </Link>
                    </Button>
                  </div>
                </Modal.Content>
              </div>
            )}
          </form>
        </Form_Shadcn_>
      </Modal>

      <SidePanelGitHubRepoLinker projectRef={ref} />
    </>
  )
}

export default EnableBranchingModal
