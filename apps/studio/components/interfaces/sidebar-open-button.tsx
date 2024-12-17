import { SquareMenu } from 'lucide-react'
import { Button, useSidebar } from 'ui'

export function SidebarOpenButton() {
  const { state, setOpen } = useSidebar()
  return (
    state === 'collapsed' && (
      <Button onClick={() => setOpen(true)} className="px-0.5 py-0.5" type="text">
        <SquareMenu size={16} strokeWidth={1} />
      </Button>
    )
  )
}
