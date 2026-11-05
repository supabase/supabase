'use client'

import {
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'

import {
  COMPUTE_ALPHA_CONSTRAINTS,
  COMPUTE_ALPHA_LIMITS,
  COMPUTE_LIMITS_MODES,
  COMPUTE_PLAN_LIMITS,
  type ComputeLimits,
  type ComputeLimitsMode,
} from '@/components/interfaces/Compute/Compute.limits'
import { useComputeLimitsMode } from '@/components/interfaces/Compute/useComputeLimits'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const MODE_LABELS: Record<ComputeLimitsMode, string> = {
  alpha: 'Private alpha (enforced)',
  plans: 'Plan mocks',
}

const formatLimit = (value: number | null) => (value === null ? '—' : value.toLocaleString())

const LIMIT_ROWS: { id: string; label: string; limits: ComputeLimits }[] = [
  { id: 'alpha', label: 'Private alpha', limits: COMPUTE_ALPHA_LIMITS },
  ...Object.entries(COMPUTE_PLAN_LIMITS).map(([id, limits]) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    limits,
  })),
]

export const ComputeLimitsTab = () => {
  const { mode, setMode } = useComputeLimitsMode()
  const { data: organization } = useSelectedOrganizationQuery()
  const activeRowId = mode === 'alpha' ? 'alpha' : (organization?.plan?.id ?? 'free')

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-foreground-light">
          Limits the Compute usage meters measure against.
        </p>
        <ToggleGroup
          type="single"
          size="sm"
          value={mode}
          onValueChange={(value) => {
            const nextMode = COMPUTE_LIMITS_MODES.find((option) => option === value)
            if (nextMode) setMode(nextMode)
          }}
        >
          {COMPUTE_LIMITS_MODES.map((key) => (
            <ToggleGroupItem key={key} value={key} className="text-xs">
              {MODE_LABELS[key]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Limits</TableHead>
            <TableHead className="text-right">vCPU-hrs / cycle</TableHead>
            <TableHead className="text-right">GB-hrs / cycle</TableHead>
            <TableHead className="text-right">Deployments</TableHead>
            <TableHead className="text-right">Instances / project</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {LIMIT_ROWS.map(({ id, label, limits }) => (
            <TableRow key={id} className={cn(id === activeRowId && 'bg-surface-200')}>
              <TableCell className="text-xs">
                {label}
                {id === activeRowId && <span className="ml-2 text-brand">In effect</span>}
              </TableCell>
              <TableCell className="text-xs text-right tabular-nums">
                {formatLimit(limits.vcpuHours)}
              </TableCell>
              <TableCell className="text-xs text-right tabular-nums">
                {formatLimit(limits.gbHours)}
              </TableCell>
              <TableCell className="text-xs text-right tabular-nums">
                {formatLimit(limits.deployments)}
              </TableCell>
              <TableCell className="text-xs text-right tabular-nums">
                {formatLimit(limits.instances)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="text-xs text-foreground-lighter">
        Private alpha also restricts sizes to {COMPUTE_ALPHA_CONSTRAINTS.sizes.join(', ')}, region
        to {COMPUTE_ALPHA_CONSTRAINTS.region}, suspends idle instances after{' '}
        {COMPUTE_ALPHA_CONSTRAINTS.idleSuspendSeconds}s, and caps instance lifetime at{' '}
        {COMPUTE_ALPHA_CONSTRAINTS.maxInstanceLifetimeHours}h. “—” means no fixed limit.
      </p>
    </div>
  )
}
