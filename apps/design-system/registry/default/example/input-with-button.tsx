import { Button } from 'ui'
import { Input_Shadcn_ } from 'ui'

export default function InputWithButton() {
  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input_Shadcn_ type="email" placeholder="Email" />
      <Button htmlType="submit" type="secondary">
        Subscribe
      </Button>
    </div>
  )
}
