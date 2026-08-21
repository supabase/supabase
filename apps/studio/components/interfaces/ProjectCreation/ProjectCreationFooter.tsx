import { useFlag } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import {
  Badge,
  Button,
  cn,
  PopoverSeparator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import { CreateProjectForm } from './ProjectCreation.schema'
import { instanceLabel, monthlyInstancePrice } from './ProjectCreation.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { DOCS_URL } from '@/lib/constants'

/** `close` = close the popup (Vercel interstitial); `studio` = navigate into Studio. */
export type ProjectCreationCancelAction = 'studio' | 'close' | 'hidden'

interface ProjectCreationFooterProps {
  form: UseFormReturn<CreateProjectForm>
  canCreateProject: boolean
  instanceSize?: string
  highAvailability?: boolean
  organizationProjects: OrgProject[]
  isCreatingNewProject: boolean
  isSuccessNewProject: boolean
  cancelAction?: ProjectCreationCancelAction
}

export const ProjectCreationFooter = ({
  form,
  canCreateProject,
  instanceSize,
  highAvailability = false,
  organizationProjects,
  isCreatingNewProject,
  isSuccessNewProject,
  cancelAction = 'studio',
}: ProjectCreationFooterProps) => {
  const router = useRouter()
  const { data: currentOrg } = useSelectedOrganizationQuery()
  const isFreePlan = currentOrg?.plan?.id === 'free'
  const { lastVisitedOrganization } = useLastVisitedOrganization()
  const [showCloseWindowHint, setShowCloseWindowHint] = useState(false)

  const projectCreationDisabled = useFlag('disableProjectCreationAndUpdate')

  const availableComputeCredits = organizationProjects.length === 0 ? 10 : 0
  const additionalMonthlySpend = isFreePlan
    ? 0
    : monthlyInstancePrice(instanceSize) - availableComputeCredits

  const showAdditionalCosts =
    !isFreePlan && !projectCreationDisabled && canCreateProject && additionalMonthlySpend > 0

  // High availability is free during Alpha, so the new project costs $0 and is excluded from
  // the totals below — the tooltip table still shows the usual compute price struck through.
  const displayedAdditionalMonthlySpend = highAvailability ? 0 : additionalMonthlySpend
  const newProjectComputeCosts = highAvailability ? 0 : monthlyInstancePrice(instanceSize)

  // [kevin] This will eventually all be provided by a new API endpoint to preview and validate project creation, this is just for kaizen now
  // Clamped since a free HA project can leave the compute credits larger than the costs
  const monthlyComputeCosts = Math.max(
    0,
    // current project costs
    organizationProjects.reduce((prev, acc) => {
      const primaryDatabase = acc.databases.find((db) => db.identifier === acc.ref)
      const cost = !!primaryDatabase ? monthlyInstancePrice(primaryDatabase.infra_compute_size) : 0
      return prev + cost
    }, 0) +
      // selected compute size
      newProjectComputeCosts -
      // compute credits
      10
  )

  const onCancel = () => {
    if (cancelAction === 'close') {
      window.close()
      return
    }

    if (!!lastVisitedOrganization) router.push(`/org/${lastVisitedOrganization}`)
    else router.push('/organizations')
  }

  useEffect(() => {
    // Browsers only allow closing windows that were opened by script (i.e. have a live `opener`).
    // Detect this upfront so we don't need to attempt-and-check after the user clicks cancel.
    if (cancelAction === 'close' && !window.opener) setShowCloseWindowHint(true)
  }, [cancelAction])

  return (
    <div key="panel-footer" className="grid grid-cols-12 w-full gap-4 items-center">
      {showAdditionalCosts && (
        <div className="col-span-4">
          <div className="flex justify-between text-sm">
            <span>Additional costs</span>
            <div className="text-brand flex gap-1 items-center font-mono font-medium">
              <span role="status">${displayedAdditionalMonthlySpend}/m</span>
              <InfoTooltip side="top" className="max-w-[450px] p-0">
                <div className="p-4 text-sm text-foreground-light space-y-1">
                  <p>
                    Each project includes a dedicated Postgres instance running on its own server.
                    You are charged for the{' '}
                    <InlineLink href={`${DOCS_URL}/guides/platform/billing-on-supabase`}>
                      Compute resource
                    </InlineLink>{' '}
                    of that server, independent of your database usage.
                  </p>
                  {highAvailability && (
                    <p>High availability projects are free during Alpha for up to 2 projects.</p>
                  )}
                  {monthlyComputeCosts > 0 && (
                    <p>Compute costs are applied on top of your subscription plan costs.</p>
                  )}
                </div>

                <Table className="mt-2">
                  <TableHeader className="[&_th]:h-7">
                    <TableRow className="py-2">
                      <TableHead className="w-[170px]">Project</TableHead>
                      <TableHead>Compute Size</TableHead>
                      <TableHead className="text-right">Monthly Costs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_td]:py-2">
                    {organizationProjects.map((project) => {
                      const primaryDb = project.databases.find(
                        (db) => db.identifier === project.ref
                      )
                      return (
                        <TableRow key={project.ref} className="text-foreground-light">
                          <TableCell className="w-[170px] truncate">{project.name}</TableCell>
                          <TableCell className="text-center">
                            {instanceLabel(primaryDb?.infra_compute_size)}
                          </TableCell>
                          <TableCell className="text-right">
                            ${monthlyInstancePrice(primaryDb?.infra_compute_size)}
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    <TableRow>
                      <TableCell className="w-[170px] flex gap-2">
                        <span className="truncate">
                          {form.getValues('projectName') || 'New project'}
                        </span>
                        <Badge variant="success">New</Badge>
                      </TableCell>
                      <TableCell className="text-center">{instanceLabel(instanceSize)}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(highAvailability && 'line-through')}>
                          ${monthlyInstancePrice(instanceSize)}
                        </span>
                        {highAvailability && (
                          <p className="text-xs text-foreground-lighter">Free during Alpha</p>
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <PopoverSeparator />
                <Table>
                  <TableHeader className="[&_th]:h-7">
                    <TableRow>
                      <TableHead colSpan={2}>Compute Credits</TableHead>
                      <TableHead colSpan={1} className="text-right">
                        -$10
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_td]:py-2">
                    <TableRow className="text-foreground">
                      <TableCell colSpan={2}>
                        Total Monthly Compute Costs
                        {/**
                         * API currently doesnt output replica information on the projects list endpoint. Until then, we cannot correctly calculate the costs including RRs.
                         * Will be adjusted in the future [kevin]
                         */}
                        {organizationProjects.length > 0 && (
                          <p className="text-xs text-foreground-lighter">Excluding Read replicas</p>
                        )}
                      </TableCell>
                      <TableCell colSpan={1} className="text-right">
                        ${monthlyComputeCosts}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </InfoTooltip>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          showAdditionalCosts ? 'col-span-8' : 'col-span-12',
          'flex items-center gap-x-2 ml-auto'
        )}
      >
        {cancelAction === 'hidden' ? null : showCloseWindowHint ? (
          <p role="status" aria-live="polite" className="text-xs text-foreground-muted mr-3">
            Close window to cancel
          </p>
        ) : (
          <Button
            type="button"
            variant="default"
            disabled={isCreatingNewProject || isSuccessNewProject}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          loading={isCreatingNewProject || isSuccessNewProject}
          disabled={!canCreateProject}
        >
          Create new project
        </Button>
      </div>
    </div>
  )
}
