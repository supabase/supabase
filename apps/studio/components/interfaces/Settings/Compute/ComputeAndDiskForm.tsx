import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { instanceSizeSpecs } from '@/data/projects/new-project.constants'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { BASE_PATH } from '@/lib/constants'
import { Button, Input, cn } from 'ui'

// [console fork] Real compute + disk management for dedicated (EC2) projects, modelled
// on Supabase's Compute and Disk page but wired to our control-plane:
//   compute -> EC2 instance type (stop/modify/start)
//   disk    -> root EBS volume (online ModifyVolume: size / IOPS / throughput)
// No Pro-plan gating. Pricing is real AWS on-demand (ARM compute + gp3 EBS, us-east-1).

const COMPUTE_TIERS = ['medium', 'large', 'xlarge', '2xlarge', '4xlarge'] as const

// EBS gp3 on-demand pricing (us-east-1).
const GP3 = { perGbMo: 0.08, iopsFree: 3000, perIopsMo: 0.005, tputFree: 125, perTputMo: 0.04 }
const diskMonthly = (sizeGb: number, iops: number, throughput: number) =>
  sizeGb * GP3.perGbMo +
  Math.max(0, iops - GP3.iopsFree) * GP3.perIopsMo +
  Math.max(0, throughput - GP3.tputFree) * GP3.perTputMo

type Disk = { sizeGb: number; iops: number; throughput: number; type: string }

export const ComputeAndDiskForm = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const queryClient = useQueryClient()

  // ---- Compute ----
  const currentCompute = (((project as any)?.infra_compute_size as string) ?? 'medium').replace(
    /^ci_/,
    ''
  )
  const [compute, setCompute] = useState<string>(currentCompute)
  useEffect(() => setCompute(currentCompute), [currentCompute])

  const computeMut = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${BASE_PATH}/api/platform/projects/${ref}/billing/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addon_type: 'compute_instance', addon_variant: `ci_${compute}` }),
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.message ?? 'Failed to resize compute')
    },
    onSuccess: () =>
      toast.success('Updating compute — the instance restarts during the change (a few minutes).'),
    onError: (e: any) => toast.error(`Failed to update compute: ${e?.message ?? e}`),
  })

  // ---- Disk ----
  const { data: disk, isLoading: diskLoading } = useQuery<Disk>({
    queryKey: ['ec2-disk', ref],
    queryFn: async () => {
      const r = await fetch(`${BASE_PATH}/api/platform/projects/${ref}/disk`)
      if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.message ?? 'Failed to load disk')
      return r.json()
    },
    enabled: !!ref,
  })
  const [sizeGb, setSizeGb] = useState(8)
  const [iops, setIops] = useState(3000)
  const [throughput, setThroughput] = useState(125)
  useEffect(() => {
    if (disk) {
      setSizeGb(disk.sizeGb)
      setIops(disk.iops)
      setThroughput(disk.throughput)
    }
  }, [disk])

  const diskMut = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${BASE_PATH}/api/platform/projects/${ref}/disk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sizeGb, iops, throughput, type: 'gp3' }),
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.message ?? 'Failed to update disk')
    },
    onSuccess: () => {
      toast.success('Updating disk — EBS applies the change online (no downtime).')
      queryClient.invalidateQueries({ queryKey: ['ec2-disk', ref] })
    },
    onError: (e: any) => toast.error(`Failed to update disk: ${e?.message ?? e}`),
  })

  const diskChanged =
    !!disk && (sizeGb !== disk.sizeGb || iops !== disk.iops || throughput !== disk.throughput)
  const diskCost = diskMonthly(sizeGb, iops, throughput)
  const computeCost = instanceSizeSpecs[compute as keyof typeof instanceSizeSpecs]?.priceMonthly ?? 0

  return (
    <div className="space-y-8">
      {/* ---------- Compute ---------- */}
      <section className="rounded-md border border-default bg-surface-100">
        <div className="p-6 border-b border-default">
          <h3 className="text-base text-foreground">Compute size</h3>
          <p className="text-sm text-foreground-light">
            Hardware (RAM / CPU) allocated to your project. Changing it restarts the instance.
          </p>
        </div>
        <div className="p-6 grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))]">
          {COMPUTE_TIERS.map((t) => {
            const s = instanceSizeSpecs[t as keyof typeof instanceSizeSpecs]
            const selected = compute === t
            const isCurrent = currentCompute === t
            return (
              <button
                type="button"
                key={t}
                onClick={() => setCompute(t)}
                className={cn(
                  'text-left rounded-md border p-4 transition-colors',
                  selected
                    ? 'border-foreground bg-surface-200'
                    : 'border-default hover:border-strong bg-surface-100'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground uppercase">{t}</span>
                  {isCurrent && (
                    <span className="text-[10px] uppercase text-brand-600 border border-brand-500 rounded px-1.5 py-0.5">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground-light mt-1">
                  {s.ram} RAM · {s.cpu}
                </p>
                <p className="text-xs text-foreground-light mt-1">~${s.priceMonthly}/mo</p>
              </button>
            )
          })}
        </div>
        <div className="px-6 py-4 border-t border-default flex items-center justify-between">
          <p className="text-xs text-foreground-light">
            Compute ~${computeCost}/mo · billed by AWS directly
          </p>
          <Button
            type="primary"
            loading={computeMut.isPending}
            disabled={compute === currentCompute}
            onClick={() => computeMut.mutate()}
          >
            {compute === currentCompute ? 'Current size' : 'Update compute'}
          </Button>
        </div>
      </section>

      {/* ---------- Disk ---------- */}
      <section className="rounded-md border border-default bg-surface-100">
        <div className="p-6 border-b border-default">
          <h3 className="text-base text-foreground">Disk settings</h3>
          <p className="text-sm text-foreground-light">
            The instance's root EBS volume. Storage type is{' '}
            <span className="text-foreground">General Purpose SSD (gp3)</span> — a balance of price
            and performance. IOPS and throughput apply online with no downtime.
          </p>
        </div>
        <div className="p-6 grid gap-6 md:grid-cols-3">
          <div>
            <label className="text-sm text-foreground">Disk size (GB)</label>
            <p className="text-xs text-foreground-light mb-2">Min 8, max 16384 GiB.</p>
            <Input
              type="number"
              value={sizeGb}
              min={disk?.sizeGb ?? 8}
              max={16384}
              disabled={diskLoading}
              onChange={(e) => setSizeGb(Number(e.target.value))}
            />
            <p className="text-xs text-foreground-light mt-1">EBS can only grow, never shrink.</p>
          </div>
          <div>
            <label className="text-sm text-foreground">IOPS</label>
            <p className="text-xs text-foreground-light mb-2">Input/output ops per second.</p>
            <Input
              type="number"
              value={iops}
              min={3000}
              max={16000}
              disabled={diskLoading}
              onChange={(e) => setIops(Number(e.target.value))}
            />
            <p className="text-xs text-foreground-light mt-1">3000 included, then $0.005/IOPS/mo.</p>
          </div>
          <div>
            <label className="text-sm text-foreground">Throughput (MB/s)</label>
            <p className="text-xs text-foreground-light mb-2">Data read/written per second.</p>
            <Input
              type="number"
              value={throughput}
              min={125}
              max={1000}
              disabled={diskLoading}
              onChange={(e) => setThroughput(Number(e.target.value))}
            />
            <p className="text-xs text-foreground-light mt-1">125 included, then $0.04/MB/s/mo.</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-default flex items-center justify-between">
          <p className="text-xs text-foreground-light">
            Disk ~${diskCost.toFixed(2)}/mo (gp3) · billed by AWS directly
          </p>
          <Button
            type="primary"
            loading={diskMut.isPending}
            disabled={!diskChanged}
            onClick={() => diskMut.mutate()}
          >
            {diskChanged ? 'Update disk' : 'No changes'}
          </Button>
        </div>
      </section>
    </div>
  )
}
