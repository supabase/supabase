import { Link } from '@tanstack/react-router'
import {
  ArrowUpRightIcon,
  CableIcon,
  MemoryStickIcon,
  SettingsIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, CardContent } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { getMicroUpgradeRows, type UpgradedPlanId } from './PlanUpgradeSuccess.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  useOrgProjectsInfiniteQuery,
  type OrgProject,
} from '@/data/projects/org-projects-infinite-query'
import { useSetProjectStatus } from '@/data/projects/project-detail-query'
import { useProjectAddonUpdateMutation } from '@/data/subscriptions/project-addon-update-mutation'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import {
  DOCS_URL,
  INSTANCE_MICRO_SPECS,
  INSTANCE_NANO_SPECS,
  PROJECT_STATUS,
} from '@/lib/constants'
import { pluralize } from '@/lib/helpers'
import { useTrack } from '@/lib/telemetry/track'

/** How often to refresh project statuses while a project restarts onto Micro. */
const UPGRADE_POLL_INTERVAL_MS = 5000

const SpecChange = ({
  icon: Icon,
  from,
  to,
  unit,
}: {
  icon: LucideIcon
  from: number
  to: number
  unit: string
}) => (
  <li className="flex items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-xs text-foreground-light">
    <Icon size={14} className="text-foreground-lighter" aria-hidden="true" />
    <span>
      {from} → <span className="text-brand">{to}</span> {unit}
    </span>
  </li>
)

const ProjectRow = ({
  project,
  organizationSlug,
  isUpgrading,
  onUpgrade,
}: {
  project: OrgProject
  organizationSlug: string
  isUpgrading: boolean
  onUpgrade: () => void
}) => {
  const { can: canUpdateCompute, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.INFRA_DISK_CONFIG_WRITE,
    { organizationSlug, projectRef: project.ref }
  )
  const isMissingPermission = isPermissionsLoaded && !canUpdateCompute

  return (
    <li className="flex items-center justify-between gap-4 px-(--card-padding-x) py-3">
      <span className="min-w-0 truncate text-sm text-foreground" translate="no">
        {project.name}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        {isUpgrading && (
          <>
            <Button
              variant="default"
              disabled
              icon={<SettingsIcon className="motion-safe:animate-spin" aria-hidden="true" />}
            >
              Upgrading
            </Button>
            <Button asChild variant="default" iconRight={<ArrowUpRightIcon />}>
              <Link
                to="/project/$ref"
                params={{ ref: project.ref }}
                target="_blank"
                rel="noreferrer"
              >
                View progress <span className="sr-only">for {project.name}</span>
              </Link>
            </Button>
          </>
        )}
        {!isUpgrading && (
          <>
            <Badge className="mr-1 uppercase">Nano</Badge>
            <ButtonTooltip
              variant="default"
              disabled={!canUpdateCompute}
              onClick={onUpgrade}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: isMissingPermission
                    ? "You need additional permissions to change this project's compute size"
                    : undefined,
                },
              }}
            >
              Upgrade <span className="sr-only">{project.name} to Micro</span>
            </ButtonTooltip>
          </>
        )}
      </div>
    </li>
  )
}

interface MicroComputeUpgradeCardProps {
  /** The paid plan the organization just upgraded to. */
  planId: UpgradedPlanId
  organizationSlug: string
  /** All projects in the organization. The card picks the ones that can move to Micro. */
  projects: OrgProject[]
}

/**
 * Paid plans bill Nano compute at the Micro rate, so every Nano project left behind after an
 * upgrade pays for resources it doesn't get. Lists those projects and upgrades each one to
 * Micro in place, following it until it is back up.
 */
export const MicroComputeUpgradeCard = ({
  planId,
  organizationSlug,
  projects,
}: MicroComputeUpgradeCardProps) => {
  const track = useTrack()
  const { setProjectStatus } = useSetProjectStatus()
  const [upgradeRequestedRefs, setUpgradeRequestedRefs] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  const [projectToUpgrade, setProjectToUpgrade] = useState<OrgProject>()

  const rows = getMicroUpgradeRows(projects, upgradeRequestedRefs)
  const nanoProjectCount = rows.filter((row) => !row.isUpgrading).length
  const isAnyProjectUpgrading = rows.some((row) => row.isUpgrading)

  // Same query key as the list that feeds `projects`, so polling here refreshes the rows.
  useOrgProjectsInfiniteQuery(
    { slug: organizationSlug },
    {
      enabled: isAnyProjectUpgrading,
      refetchInterval: isAnyProjectUpgrading ? UPGRADE_POLL_INTERVAL_MS : false,
    }
  )

  const { mutate: updateAddon, isPending: isUpdatingAddon } = useProjectAddonUpdateMutation({
    onSuccess: (_data, { projectRef }) => {
      if (!projectRef) return
      // The project reports RESIZING on its next status poll; show it straight away.
      setProjectStatus({ ref: projectRef, slug: organizationSlug, status: PROJECT_STATUS.RESIZING })
      setUpgradeRequestedRefs((refs) => new Set(refs).add(projectRef))
      setProjectToUpgrade(undefined)
    },
  })

  if (rows.length === 0) return null

  // `projectToUpgrade` is a snapshot from when the row was clicked. Only confirm against the
  // current rows, in case the project changed size or started upgrading from another session.
  const selectedRow = rows.find((row) => row.project.ref === projectToUpgrade?.ref)
  const projectToConfirm = selectedRow && !selectedRow.isUpgrading ? selectedRow.project : undefined

  const handleConfirmUpgrade = () => {
    if (!projectToConfirm) {
      setProjectToUpgrade(undefined)
      return
    }
    track(
      'plan_upgraded_micro_compute_upgrade_submitted',
      { planId, nanoProjectCount },
      // The screen sits on an org page, so name the project being upgraded.
      { project: projectToConfirm.ref }
    )
    updateAddon({ projectRef: projectToConfirm.ref, type: 'compute_instance', variant: 'ci_micro' })
  }

  return (
    <>
      <Card className="w-full border-brand-500/50">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg text-foreground">
              {rows.length} {pluralize(rows.length, 'project')} can upgrade to Micro Compute for no
              additional costs
            </h2>
            <p className="text-sm text-foreground-light">
              <span>
                You're already billed at the Micro Compute rate. Upgrading just unlocks the extra
                capacity.
              </span>
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            <SpecChange
              icon={MemoryStickIcon}
              from={INSTANCE_NANO_SPECS.memory_gb}
              to={INSTANCE_MICRO_SPECS.memory_gb}
              unit="GB RAM"
            />
            <SpecChange
              icon={CableIcon}
              from={INSTANCE_NANO_SPECS.connections_direct}
              to={INSTANCE_MICRO_SPECS.connections_direct}
              unit="connections"
            />
          </ul>
        </CardContent>
        <ul className="divide-y border-b">
          {rows.map(({ project, isUpgrading }) => (
            <ProjectRow
              key={project.ref}
              project={project}
              organizationSlug={organizationSlug}
              isUpgrading={isUpgrading}
              onUpgrade={() => setProjectToUpgrade(project)}
            />
          ))}
        </ul>
        <CardContent className="flex items-center justify-between gap-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-foreground-light">
            <TriangleAlertIcon size={14} className="shrink-0 text-warning" aria-hidden="true" />
            <span>Each project restarts for ~1 minute.</span>
          </span>
          <a
            href={`${DOCS_URL}/guides/platform/compute-and-disk`}
            target="_blank"
            rel="noreferrer"
            className="text-foreground-lighter underline transition-colors hover:text-foreground"
          >
            Compute sizes
          </a>
        </CardContent>
      </Card>

      <ConfirmationModal
        visible={projectToConfirm !== undefined}
        title={`Upgrade ${projectToConfirm?.name ?? 'project'} to Micro`}
        description="The project restarts for ~1 minute and is unavailable while the upgrade to Micro Compute is running. There's no additional cost."
        confirmLabel="Upgrade to Micro"
        confirmLabelLoading="Upgrading"
        loading={isUpdatingAddon}
        onCancel={() => setProjectToUpgrade(undefined)}
        onConfirm={handleConfirmUpgrade}
      />
    </>
  )
}
