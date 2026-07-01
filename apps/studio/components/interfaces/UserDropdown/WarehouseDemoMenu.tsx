import { Database } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from 'ui'

import {
  applyWarehouseDemoReplicationPreset,
  setSimulateNextLinkFailure,
  type WarehouseDemoReplicationPreset,
} from '@/components/interfaces/Database/Warehouse/warehouseDemoStore'

const REPLICATION_PRESETS: { preset: WarehouseDemoReplicationPreset; label: string }[] = [
  { preset: 'healthy', label: 'Healthy (in sync)' },
  { preset: 'behind', label: 'Behind (warning)' },
  { preset: 'critical', label: 'Critical (severely behind)' },
  { preset: 'pipeline_error', label: 'Pipeline error' },
  { preset: 'copy_error', label: 'Table copy error' },
]

export function WarehouseDemoMenu() {
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex gap-2">
            <Database size={14} strokeWidth={1.5} className="text-foreground-lighter" />
            Warehouse demo
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <DropdownMenuLabel className="text-xs text-foreground-lighter">
              Replication health
            </DropdownMenuLabel>
            {REPLICATION_PRESETS.map(({ preset, label }) => (
              <DropdownMenuItem
                key={preset}
                className="cursor-pointer"
                onClick={() => {
                  const applied = applyWarehouseDemoReplicationPreset(preset)
                  if (!applied) {
                    toast.message('Link a table to Warehouse first to preview replication health.')
                    return
                  }
                  toast.message(`Warehouse demo: ${label}`)
                }}
              >
                {label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-foreground-lighter">
              First-time setup
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                setSimulateNextLinkFailure(true)
                toast.message('Next “Copy to Warehouse” will fail (demo)')
              }}
            >
              Fail next copy to Warehouse
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuGroup>
    </>
  )
}
