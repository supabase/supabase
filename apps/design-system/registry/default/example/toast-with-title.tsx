'use client'

import { Button } from 'ui'
import { useToast } from 'ui'

export default function ToastWithTitle() {
  const { toast } = useToast()

  return (
    <Button
      type="outline"
      onClick={() => {
        toast({
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem with your request.',
        })
      }}
    >
      Show Toast
    </Button>
  )
}
