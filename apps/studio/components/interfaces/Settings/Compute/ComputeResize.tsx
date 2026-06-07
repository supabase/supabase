import { useMutation } from '@tanstack/react-query'
import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'

import { BASE_PATH } from '@/lib/constants'
import { instanceSizeSpecs } from '@/data/projects/new-project.constants'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'

// [console fork] Self-host compute resize for dedicated (EC2) projects. The full
// upstream DiskManagementForm is coupled to the cloud billing/disk model; this is a
// focused control that resizes the underlying instance via the compute add-on route.
const TIERS = ['medium', 'large', 'xlarge', '2xlarge', '4xlarge'] as const

export const ComputeResize = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const current = ((project as any)?.infra_compute_size as string) ?? 'medium'
  const [size, setSize] = useState<string>(TIERS.includes(current as any) ? current : 'medium')

  const { mutate: resize, isPending: isLoading } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE_PATH}/api/platform/projects/${ref}/billing/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addon_type: 'compute_instance', addon_variant: `ci_${size}` }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message ?? 'Failed to resize compute')
      }
    },
    onSuccess: () => {
      toast.success(
        'Resizing your project — the instance will stop, change size, and restart. This takes a few minutes.'
      )
    },
    onError: (e: any) => toast.error(`Failed to resize: ${e?.message ?? e}`),
  })

  const spec = instanceSizeSpecs[size as keyof typeof instanceSizeSpecs]

  return (
    <div className="rounded-md border border-default bg-surface-100">
      <div className="p-6 space-y-4">
        <div>
          <p className="text-sm text-foreground">Compute size</p>
          <p className="text-sm text-foreground-light">
            Resize this dedicated project's instance. Larger sizes give more RAM/CPU. The instance
            restarts during the change (a few minutes of downtime).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Select a compute size" />
            </SelectTrigger>
            <SelectContent>
              {TIERS.map((t) => {
                const s = instanceSizeSpecs[t as keyof typeof instanceSizeSpecs]
                return (
                  <SelectItem key={t} value={t}>
                    {s.ram} RAM / {s.cpu} (~${s.priceMonthly}/mo)
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <Button
            type="primary"
            loading={isLoading}
            disabled={size === current}
            onClick={() => resize()}
          >
            {size === current ? 'Current size' : 'Resize'}
          </Button>
        </div>
        {spec && (
          <p className="text-xs text-foreground-light">
            {spec.ram} RAM · {spec.cpu} · ~${spec.priceMonthly}/month (billed by AWS directly)
          </p>
        )}
      </div>
    </div>
  )
}
