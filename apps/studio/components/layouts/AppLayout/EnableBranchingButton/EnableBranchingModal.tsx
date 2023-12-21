import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { last } from 'lodash'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Form_Shadcn_,
  IconDollarSign,
  IconExternalLink,
  IconFileText,
  IconGitBranch,
  Modal,
} from 'ui'
import * as z from 'zod'

import SidePanelGitHubRepoLinker from 'components/interfaces/Organization/IntegrationSettings/SidePanelGitHubRepoLinker'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useProjectUpgradeEligibilityQuery } from 'data/config/project-upgrade-eligibility-query'
import { useCheckGithubBranchValidity } from 'data/integrations/integrations-github-branch-check'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSelectedOrganization, useStore } from 'hooks'
import { useAppStateSnapshot } from 'state/app-state'
import BranchingPITRNotice from './BranchingPITRNotice'
import BranchingPostgresVersionNotice from './BranchingPostgresVersionNotice'
import GithubRepositorySelection from './GithubRepositorySelection'
import Link from 'next/link'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import BranchingPlanNotice from './BranchingPlanNotice'

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

  const {
    data,
    error: upgradeEligibilityError,
    isLoading: isLoadingUpgradeEligibility,
    isError: isErrorUpgradeEligibility,
    isSuccess: isSuccessUpgradeEligibility,
  } = useProjectUpgradeEligibilityQuery({
    projectRef: ref,
  })
  const hasMinimumPgVersion =
    Number(last(data?.current_app_version.split('-') ?? [])?.split('.')[0] ?? 0) >= 15

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrg?.slug })
  const isFreePlan = subscription?.plan.id === 'free'

  const { data: addons } = useProjectAddonsQuery({ projectRef: ref })
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

  const isLoading = isLoadingIntegrations || isLoadingUpgradeEligibility
  const isError = isErrorIntegrations || isErrorUpgradeEligibility
  const isSuccess = isSuccessIntegrations && isSuccessUpgradeEligibility

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
        className="!bg !max-w-[40rem]"
        size="xlarge"
      >
        <Form_Shadcn_ {...form}>
          <form
            id={formId}
            onSubmit={form.handleSubmit(onSubmit)}
            onChange={() => setIsValid(false)}
          >
            <Modal.Content className="px-7 py-5 flex items-center justify-between space-x-4">
              <div className="flex items-center gap-x-4">
                <IconGitBranch strokeWidth={2} size={20} />
                <div>
                  <p className="text-foreground">Enable database branching</p>
                  <p className="text-sm text-foreground-light">Manage environments in Supabase</p>
                </div>
              </div>
              <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                <Link
                  href="https://supabase.com/docs/guides/platform/branching"
                  target="_blank"
                  rel="noreferrer"
                >
                  Documentation
                </Link>
              </Button>
            </Modal.Content>

            {isLoading && (
              <>
                <Modal.Separator />
                <Modal.Content className="px-7 py-6">
                  <GenericSkeletonLoader />
                </Modal.Content>
                <Modal.Separator />
              </>
            )}

            {isError && (
              <>
                <Modal.Separator />
                <Modal.Content className="px-7 py-6">
                  {isErrorIntegrations ? (
                    <AlertError
                      error={integrationsError}
                      subject="Failed to retrieve integrations"
                    />
                  ) : isErrorUpgradeEligibility ? (
                    <AlertError
                      error={upgradeEligibilityError}
                      subject="Failed to retrieve Postgres version"
                    />
                  ) : null}
                </Modal.Content>
                <Modal.Separator />
              </>
            )}

            {isSuccess && (
              <>
                {isFreePlan ? (
                  <BranchingPlanNotice />
                ) : !hasMinimumPgVersion ? (
                  <BranchingPostgresVersionNotice />
                ) : (
                  <>
                    <GithubRepositorySelection
                      form={form}
                      isChecking={isChecking}
                      isValid={canSubmit}
                      integration={githubIntegration}
                      hasGithubIntegrationInstalled={hasGithubIntegrationInstalled}
                    />
                    {!hasPitrEnabled && <BranchingPITRNotice />}
                  </>
                )}
                <Modal.Content className="px-7 py-6 flex flex-col gap-3">
                  <p className="text-sm text-foreground-light">
                    Please keep in mind the following:
                  </p>
                  <div className="flex flex-row gap-4">
                    <div>
                      <figure className="w-10 h-10 rounded-md bg-warning-200 border border-warning-300 flex items-center justify-center">
                        <IconDollarSign className="text-amber-900" size={20} strokeWidth={2} />
                      </figure>
                    </div>
                    <div className="flex flex-col gap-y-1">
                      <p className="text-sm text-foreground">
                        Preview branches are billed $0.32 per day (approximately $10 per month)
                      </p>
                      <p className="text-sm text-foreground-light">
                        Launching a new preview branch incurs additional compute costs at $0.32 per
                        day. This cost will continue for as long as the branch has not been removed.
                        This pricing is for Early Access and is subject to change.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4 mt-2">
                    <div>
                      <figure className="w-10 h-10 rounded-md bg-warning-200 border border-warning-300 flex items-center justify-center">
                        <IconFileText className="text-amber-900" size={20} strokeWidth={2} />
                      </figure>
                    </div>
                    <div className="flex flex-col gap-y-1">
                      <p className="text-sm text-foreground">
                        Branching uses your GitHub repository to apply migrations
                      </p>
                      <p className="text-sm text-foreground-light">
                        Database migrations are handled via the{' '}
                        <code className="text-xs">./supabase</code> directory in your GitHub repo.
                        Migration files will run on both Preview Branches and Production when
                        pushing to and merging git branches.
                      </p>
                    </div>
                  </div>
                </Modal.Content>
              </>
            )}

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
                  disabled={!isSuccess || isCreating || !canSubmit}
                  loading={isCreating}
                  type="primary"
                  htmlType="submit"
                >
                  I understand, enable branching
                </Button>
              </div>
            </Modal.Content>
          </form>
        </Form_Shadcn_>
      </Modal>

      <SidePanelGitHubRepoLinker projectRef={ref} />
    </>
  )
}

export default EnableBranchingModal
