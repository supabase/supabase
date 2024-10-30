import { Switch } from 'ui'
import { Label_Shadcn_ } from 'ui'

export default function SwitchDemo() {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label_Shadcn_ htmlFor="airplane-mode">Airplane Mode</Label_Shadcn_>
    </div>
  )
}
