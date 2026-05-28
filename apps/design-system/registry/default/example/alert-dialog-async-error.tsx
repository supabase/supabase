import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

const resetTemplate = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1200))
  throw new Error('Template reset failed')
}

export default function AlertDialogAsyncError() {
  const [error, setError] = useState<string | null>(null)

  const handleResetTemplate = async () => {
    setError(null)

    try {
      await resetTemplate()
    } catch (error) {
      setError('Check the template configuration and try again.')
      throw error
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="outline">Show Alert Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset email template?</AlertDialogTitle>
          <AlertDialogDescription>
            This will replace the current email template with the default version. Any unsaved
            changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <AlertDialogBody>
            <Admonition type="destructive" title="Failed to reset template" description={error} />
          </AlertDialogBody>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="warning" onClick={handleResetTemplate}>
            Reset template
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
