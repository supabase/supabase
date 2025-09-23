import { toast } from 'sonner'
import { Button } from 'ui'

export default function SonnerDemo() {
  return (
    <Button
      type="default"
      onClick={() =>
        toast('Event has been created', {
          description: 'Sunday, December 03, 2023 at 9:00 AM',
          cancel: {
            label: 'Undo',
            onClick: () => console.log('Undo'),
          },
        })
      }
    >
      Show Toast
    </Button>
  )
}
