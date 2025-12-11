import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, ChevronsUpDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
// End of third-party imports

import { useParams } from 'common'
import CopyButton from 'components/ui/CopyButton'
import InformationBox from 'components/ui/InformationBox'
import { OrganizationProjectSelector } from 'components/ui/OrganizationProjectSelector'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import {
  Button,
  cn,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { useHighlightProjectRefContext } from './HighlightContext'
import type { ExtendedSupportCategories } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'
import { NO_ORG_MARKER, NO_PROJECT_MARKER } from './SupportForm.utils'

interface ProjectAndPlanProps {
  form: UseFormReturn<SupportFormValues>
  orgSlug: string | null
  projectRef: string | null
  category: ExtendedSupportCategories
  subscriptionPlanId: string | undefined
  showPlanExpectationInfo?: boolean
}

export function ProjectAndPlanInfo({
  form,
  orgSlug,
  projectRef,
  category,
  subscriptionPlanId,
  showPlanExpectationInfo = true,
}: ProjectAndPlanProps) {
  const { ref } = useHighlightProjectRefContext()
  const hasProjectSelected = projectRef && projectRef !== NO_PROJECT_MARKER

  return (
    <div ref={ref} className={'flex flex-col gap-y-2'}>
      <ProjectSelector form={form} orgSlug={orgSlug} projectRef={projectRef} />
      <ProjectRefHighlighted projectRef={projectRef} />

      {!hasProjectSelected && (
        <Admonition type="default" title="Please note that no project has been selected" />
      )}

      {showPlanExpectationInfo &&
        orgSlug &&
        subscriptionPlanId !== 'enterprise' &&
        subscriptionPlanId !== 'platform' &&
        category !== 'Login_issues' && (
          <PlanExpectationInfoBox orgSlug={orgSlug} planId={subscriptionPlanId} />
        )}
    </div>
  )
}

interface ProjectSelectorProps {
  form: UseFormReturn<SupportFormValues>
  orgSlug: string | null
  projectRef: string | null
}

function ProjectSelector({ form, orgSlug, projectRef }: ProjectSelectorProps) {
  const { projectRef: urlProjectRef } = useParams()

  return (
    <FormField_Shadcn_
      name="projectRef"
      control={form.control}
      render={({ field }) => (
        <FormItemLayout hideMessage layout="vertical" label="Which project is affected?">
          <FormControl_Shadcn_>
            <OrganizationProjectSelector
              key={orgSlug}
              sameWidthAsTrigger
              fetchOnMount
              checkPosition="left"
              slug={!orgSlug || orgSlug === NO_ORG_MARKER ? undefined : orgSlug}
              selectedRef={field.value}
              onInitialLoad={(projects) => {
                if (!urlProjectRef && (!projectRef || projectRef === NO_PROJECT_MARKER))
                  field.onChange(projects[0]?.ref ?? NO_PROJECT_MARKER)
              }}
              onSelect={(project) => field.onChange(project.ref)}
              renderTrigger={({ isLoading, project }) => {
                return (
                  <Button
                    block
                    type="default"
                    role="combobox"
                    aria-label="Select a project"
                    size="small"
                    className="justify-between"
                    iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                  >
                    {!!orgSlug && isLoading ? (
                      <ShimmeringLoader className="w-44 py-2" />
                    ) : !field.value || field.value === NO_PROJECT_MARKER ? (
                      'No specific project'
                    ) : (
                      project?.name ?? 'Unknown project'
                    )}
                  </Button>
                )
              }}
              renderActions={(setOpen) => (
                <CommandGroup_Shadcn_>
                  <CommandItem_Shadcn_
                    className="w-full gap-x-2"
                    onSelect={() => {
                      field.onChange(NO_PROJECT_MARKER)
                      setOpen(false)
                    }}
                  >
                    {field.value === NO_PROJECT_MARKER && <Check size={16} />}
                    <p className={field.value !== NO_PROJECT_MARKER ? 'ml-6' : ''}>
                      No specific project
                    </p>
                  </CommandItem_Shadcn_>
                </CommandGroup_Shadcn_>
              )}
            />
          </FormControl_Shadcn_>
        </FormItemLayout>
      )}
    />
  )
}

interface ProjectRefHighlightedProps {
  projectRef: string | null
}

function ProjectRefHighlighted({ projectRef }: ProjectRefHighlightedProps) {
  const isVisible = !!projectRef && projectRef !== NO_PROJECT_MARKER

  const { shouldHighlightRef, setShouldHighlightRef: setHighlight } =
    useHighlightProjectRefContext()

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-x-1"
        >
          <p
            className={cn(
              'text-sm prose transition',
              shouldHighlightRef ? 'text-foreground' : 'text-foreground-lighter'
            )}
          >
            Project ID:{' '}
            <code
              className={cn(
                'transition',
                shouldHighlightRef
                  ? 'text-brand font-medium border-brand-500 animate-pulse'
                  : 'text-foreground-light'
              )}
            >
              {projectRef}
            </code>
          </p>
          <CopyButton
            iconOnly
            type="text"
            text={projectRef}
            onClick={() => {
              toast.success('Copied to clipboard')
              setHighlight(false)
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface PlanExpectationInfoBoxProps {
  orgSlug: string
  planId?: string
}

const PlanExpectationInfoBox = ({ orgSlug, planId }: PlanExpectationInfoBoxProps) => {
  const { billingAll } = useIsFeatureEnabled(['billing:all'])

  return (
    <InformationBox
      icon={<AlertCircle size={18} strokeWidth={2} />}
      defaultVisibility={true}
      hideCollapse={true}
      title="Expected response times are based on your organization's plan"
      description={
        <div className="flex flex-col gap-y-4 mb-1">
          {planId === 'free' && (
            <p>
              Free Plan support is available within the community and officially by the team on a
              best efforts basis. For a guaranteed response we recommend upgrading to the Pro Plan.
              Enhanced SLAs for support are available on our Enterprise Plan.
            </p>
          )}

          {planId === 'pro' && (
            <p>
              Pro Plan includes email-based support. You can expect an answer within 1 business day
              in most situations for all severities. We recommend upgrading to the Team Plan for
              prioritized ticketing on all issues and prioritized escalation to product engineering
              teams. Enhanced SLAs for support are available on our Enterprise Plan.
            </p>
          )}

          {planId === 'team' && (
            <p>
              Team Plan includes email-based support. You get prioritized ticketing on all issues
              and prioritized escalation to product engineering teams. Low, Normal, and High
              severity tickets will generally be handled within 1 business day, while Urgent issues,
              we respond within 1 day, 365 days a year. Enhanced SLAs for support are available on
              our Enterprise Plan.
            </p>
          )}

          {billingAll && planId !== 'enterprise' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-y-2 sm:gap-x-2">
              <Button asChild>
                <Link
                  href={`/org/${orgSlug}/billing?panel=subscriptionPlan&source=planSupportExpectationInfoBox`}
                >
                  Upgrade project
                </Link>
              </Button>
              <Button asChild type="default" icon={<ExternalLink />}>
                <Link
                  href="https://supabase.com/contact/enterprise"
                  target="_blank"
                  rel="noreferrer"
                >
                  Enquire about Enterprise
                </Link>
              </Button>
            </div>
          )}
        </div>
      }
    />
  )
}
