import { Settings2Icon } from 'lucide-react'
import { useState } from 'react'
import { Button, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Popover_Shadcn_ } from 'ui'

export const NotificationsFilter = () => {
  const [open, setOpen] = useState(false)
  return (
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="text" icon={<Settings2Icon size={14} />} className="px-1" />
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-52" side="bottom" align="end">
        Hello
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
