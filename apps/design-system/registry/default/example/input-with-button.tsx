import { Button, Input } from 'ui'

export default function InputWithButton() {
  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input type="email" placeholder="Email" />
      <Button type="submit" variant="secondary">
        Subscribe
      </Button>
    </div>
  )
}
