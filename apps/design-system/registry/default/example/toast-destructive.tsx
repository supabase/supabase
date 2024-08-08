'use client'

import { Button } from 'ui'
import { ToastAction } from 'ui'
import { useToast } from 'ui'

export default function ToastDestructive() {
  const { toast } = useToast()

  return (
    <Button
      type="outline"
      onClick={() => {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem with your request.',
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        })
      }}
    >
      Show Toast
    </Button>
  )
}
