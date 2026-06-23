import { CpuIcon, HardDrive, Lock, Microchip } from 'lucide-react'
import { RadioGroupCard, RadioGroupCardItem } from 'ui'
import { ComputeBadge } from 'ui-patterns'

import { InfraInstanceSize } from '../DiskManagement.types'

const MOCK_HIGH_AVAILABILITY_OPTIONS = [
  {
    id: 'current',
    computeSize: 'small',
    memory: '4 GB memory',
    cpu: '2-core CPU',
    disk: '100 GB SSD disk',
    current: true,
  },
  {
    id: 'medium',
    computeSize: 'medium',
    memory: '8 GB memory',
    cpu: '4-core CPU',
    disk: '200 GB SSD disk',
    current: false,
  },
  {
    id: 'large',
    computeSize: 'large',
    memory: '16 GB memory',
    cpu: '8-core CPU',
    disk: '500 GB SSD disk',
    current: false,
  },
  {
    id: 'xlarge',
    computeSize: 'xlarge',
    memory: '32 GB memory',
    cpu: '16-core CPU',
    disk: '1 TB SSD disk',
    current: false,
  },
] as const

export function HighAvailabilitySizeField() {
  return (
    <RadioGroupCard value="current">
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,13em),1fr))]">
        {MOCK_HIGH_AVAILABILITY_OPTIONS.map((option) => (
          <RadioGroupCardItem
            id={`ha-${option.id}`}
            key={option.id}
            value={option.id}
            showIndicator={false}
            disabled={!option.current}
            className="relative text-sm text-left flex flex-col gap-0 px-0 py-3 [&_label]:w-full group w-full h-[134px]"
            label={
              <div className="w-full flex flex-col gap-3 justify-between">
                <div className="relative px-3 opacity-50 group-data-checked:opacity-100 flex justify-between">
                  <div className="flex items-center gap-2">
                    <ComputeBadge
                      className="inline-flex font-semibold"
                      infraComputeSize={option.computeSize as InfraInstanceSize}
                    />
                    <span className="text-xs text-foreground-light">HA</span>
                  </div>
                  {!option.current && (
                    <div className="border rounded-lg h-7 w-7 flex items-center justify-center">
                      <Lock size={14} />
                    </div>
                  )}
                </div>

                <div className="px-3 text-sm grid grid-cols-1 gap-1">
                  <div className="text-foreground-light flex gap-2 items-center">
                    <Microchip strokeWidth={1} size={14} className="text-foreground-lighter" />
                    <span>{option.memory}</span>
                  </div>
                  <div className="text-foreground-light flex gap-2 items-center">
                    <CpuIcon strokeWidth={1} size={14} className="text-foreground-lighter" />
                    <span>{option.cpu}</span>
                  </div>
                  <div className="text-foreground-light flex gap-2 items-center">
                    <HardDrive strokeWidth={1} size={14} className="text-foreground-lighter" />
                    <span>{option.disk}</span>
                  </div>
                </div>
              </div>
            }
          />
        ))}
      </div>
    </RadioGroupCard>
  )
}
