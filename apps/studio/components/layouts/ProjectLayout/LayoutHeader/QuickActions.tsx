import { useCallback } from 'react'
import { DatabaseZap, Lock, PlusIcon } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { EdgeFunctions, Reports, Storage, TableEditor } from 'icons'
import { Kbd } from 'components/ui/DataTable/primitives/Kbd'

interface QuickActionOption {
  label: string
  icon: React.ElementType
  onClick?: () => void
  href?: string
  kbd?: string[]
}

const quickActionOptions: () => QuickActionOption[] = () => {
  const router = useRouter()
  const { ref } = useParams()
  const snap = useTableEditorStateSnapshot()

  const handleNewTable = useCallback(() => {
    router.push(`/project/${ref}/editor`)
    snap.onAddTable()
  }, [])

  return [
    {
      label: 'New Table',
      icon: TableEditor,
      onClick: handleNewTable,
      kbd: ['c', 't'],
    },
    {
      label: 'RLS Policy',
      icon: Lock,
      onClick: () => null,
      kbd: ['c', 'r'],
    },
    {
      label: 'Database Trigger',
      icon: DatabaseZap,
      onClick: () => null,
      kbd: ['c', 't', 'r'],
    },
    {
      label: 'Storage Bucket',
      icon: Storage,
      onClick: () => null,
      kbd: ['c', 'b'],
    },
    {
      label: 'Edge Function',
      icon: EdgeFunctions,
      onClick: () => null,
      kbd: ['c', 'f'],
    },
    {
      label: 'Custom Report',
      icon: Reports,
      onClick: () => null,
      kbd: ['c', 'r'],
    },
  ]
}

const KbdSlot = ({ option }: { option: QuickActionOption }) => (
  <div>
    {option.kbd?.map((k) => (
      <Kbd key={`kbd-${k}`} className="text-foreground-lighter">
        {k}
      </Kbd>
    ))}
  </div>
)

const QuickActions = () => {
  const options = quickActionOptions()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-7 h-7 rounded-full hover:!cursor-pointer">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="primary" className="!p-0 rounded-full w-7 h-7">
              <PlusIcon size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Create</TooltipContent>
        </Tooltip>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-56">
        {options.map((option) => (
          <DropdownMenuItem asChild key={option.label}>
            <button
              type="button"
              onClick={option.onClick}
              className="group w-full cursor-pointer flex items-center gap-2 text-foreground-light hover:text-foreground"
            >
              <option.icon size={14} className="text-foreground-lighter" />
              <span className="text-left flex-1">{option.label}</span>
              <KbdSlot option={option} />
            </button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default QuickActions
