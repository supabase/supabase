'use client'

import { Button } from 'ui'
import { ToastAction } from 'ui'
import { useToast } from 'ui'

export default function ToastDemo() {
  const { toast } = useToast()

  return (
    <Button
      type="outline"
      onClick={() => {
        toast({
          title: 'Scheduled: Catch up ',
          description: 'Friday, February 10, 2023 at 5:57 PM',
          action: <ToastAction altText="Goto schedule to undo">Undo</ToastAction>,
        })
      }}
    >
      Add to calendar
    </Button>
  )
}
