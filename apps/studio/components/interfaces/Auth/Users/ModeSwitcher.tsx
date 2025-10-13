import {
  cn,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
} from 'ui'

interface ModeSwitcherProps {
  mode: 'performance' | 'freeform'
  setMode: (value: 'performance' | 'freeform') => void
}

export const ModeSwitcher = ({ mode, setMode }: ModeSwitcherProps) => {
  return (
    <div className="flex items-center">
      <div
        className={cn(
          'text-xs h-[26px] flex items-center px-2 border rounded-l-md transition',
          mode === 'performance'
            ? 'bg-surface-300 text-foreground-light border-strong'
            : 'bg-warning-300 text-warning text-opacity-70 border-warning-500'
        )}
      >
        Mode
      </div>
      <Select_Shadcn_ value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <SelectTrigger_Shadcn_
          size="tiny"
          className={cn(
            'w-[100px] rounded-l-none -ml-[1px] pr-1.5 transition focus:!ring-0 focus:!ring-offset-0',
            mode === 'performance'
              ? '!bg-transparent'
              : 'text-warning !bg-warning-200 border-warning-500 hover:border-warning-600/60'
          )}
        >
          {mode === 'performance' ? 'Optimized' : 'Freeform'}
        </SelectTrigger_Shadcn_>
        <SelectContent_Shadcn_ className="w-80">
          <SelectGroup_Shadcn_>
            <SelectItem_Shadcn_
              value="performance"
              className="items-start [&>span:first-child]:top-2"
            >
              <div className="flex flex-col gap-y-1">
                <p className="text-xs">Optimized search</p>
                <p className="prose text-xs">
                  Uses fast and light prefix search, ideal for most day-to-day operations.
                </p>
              </div>
            </SelectItem_Shadcn_>
            <SelectItem_Shadcn_ value="freeform" className="items-start [&>span:first-child]:top-2">
              <div className="flex flex-col gap-y-1">
                <p className="text-xs text-warning">Freeform search</p>
                <p className="prose text-xs">
                  Runs full-table scans across multiple columns. May adversely impact your database
                  if the table has a large number of rows.{' '}
                  <span className="text-warning">Use with caution!</span>
                </p>
              </div>
            </SelectItem_Shadcn_>
          </SelectGroup_Shadcn_>
        </SelectContent_Shadcn_>
      </Select_Shadcn_>
    </div>
  )
}
