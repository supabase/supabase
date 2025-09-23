import { toast } from 'sonner'
import { Button } from 'ui'

export default function SonnerDemo() {
  const promise = () =>
    new Promise((resolve) => setTimeout(() => resolve({ name: 'Sonner' }), 2000))

  return (
    <div className="flex gap-1">
      <Button type="default" onClick={() => toast('Event has been created')}>
        Default
      </Button>
      <Button
        type="default"
        onClick={() =>
          toast.message('Event has been created', {
            description: 'Monday, January 3rd at 6:00pm',
          })
        }
      >
        description
      </Button>
      <Button
        type="default"
        onClick={() =>
          toast.success('Event has been created', {
            description: 'Sunday, December 03, 2023 at 9:00 AM',
          })
        }
      >
        Success
      </Button>
      <Button type="default" onClick={() => toast.success('Event has been created')}>
        Show Toast
      </Button>
      <Button
        type="default"
        onClick={() => toast.info('Be at the area 10 minutes before the event time')}
      >
        Info
      </Button>
      <Button
        type="warning"
        onClick={() => toast.warning('Event start time cannot be earlier than 8am')}
      >
        Warning
      </Button>
      <Button type="danger" onClick={() => toast.error('Event has not been created')}>
        Error
      </Button>
      <Button
        type="primary"
        onClick={() =>
          toast('Event has been created', {
            action: {
              label: 'Action!',
              onClick: () => console.log('Undo'),
            },
          })
        }
      >
        Action
      </Button>
      <Button type="default" onClick={() => toast.loading('Event has been created')}>
        Loading
      </Button>
      <Button
        type="default"
        onClick={() =>
          toast.promise(promise, {
            loading: 'Loading...',
            success: (data) => {
              // @ts-expect-error
              return `${data.name} toast has been added`
            },
            error: 'Error',
          })
        }
      >
        Promise
      </Button>
      <Button
        type="default"
        onClick={() =>
          toast(
            <>
              <div>A custom toast with default styling</div>
              <Button type="default">Hello world</Button>
            </>
          )
        }
      >
        Custom
      </Button>
    </div>
  )
}
