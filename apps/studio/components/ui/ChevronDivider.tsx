import { ChevronsLeftRight } from 'lucide-react'
import { cn } from 'ui'
import DotGrid from './DotGrid'

interface ChevronDividerProps {
  className?: string
}

function ChevronDivider({ className }: ChevronDividerProps) {
  return (
    <div className={cn('flex items-center justify-center w-full', className)}>
      <div className="flex-1 border-t border-dashed border-muted-foreground opacity-50" />
      <div className="mx-2 relative rounded-full bg-[#232323] border border-[#333] flex items-center justify-center w-10 h-10 shadow-sm overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <DotGrid rows={5} columns={5} count={25} />
        </div>
        <ChevronsLeftRight className="text-muted-foreground relative z-10" size={24} />
      </div>
      <div className="flex-1 border-t border-dashed border-muted-foreground opacity-50" />
    </div>
  )
}

export { ChevronDivider }
