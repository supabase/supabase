'use client'

import { Button } from 'ui'
import { useToast } from 'ui'

export default function ToastSimple() {
  const { toast } = useToast()

  return (
    <Button
      type="outline"
      onClick={() => {
        toast({
          description: 'Your message has been sent.',
        })
      }}
    >
      Show Toast
    </Button>
  )
}
