import { Meta } from '@storybook/react'

import { Checkbox } from '@ui/components/shadcn/ui/checkbox'
import { Label } from '@ui/components/shadcn/ui/label'

const meta: Meta = {
  title: 'shadcn/Label',
  component: Label,
}

export function Default() {
  return (
    <div>
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
    </div>
  )
}

export default meta
