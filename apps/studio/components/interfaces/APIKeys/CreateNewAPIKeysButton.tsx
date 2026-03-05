import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useAPIKeyCreateMutation } from 'data/api-keys/api-key-create-mutation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from 'ui'

export const CreateNewAPIKeysButton = () => {
  const { ref: projectRef } = useParams()

  const [isCreatingKeys, setIsCreatingKeys] = useState(false)
  const [createKeysDialogOpen, setCreateKeysDialogOpen] = useState(false)

  const { mutateAsync: createAPIKey } = useAPIKeyCreateMutation()

  const handleCreateNewApiKeys = async () => {
    if (!projectRef) return
    setIsCreatingKeys(true)

    try {
      // Create publishable key
      await createAPIKey({ projectRef, type: 'publishable', name: 'default' })

      // Create secret key
      await createAPIKey({ projectRef, type: 'secret', name: 'default' })

      setCreateKeysDialogOpen(false)
      toast.success('Successfully created a new set of API keys!')
    } catch (error:unknown) {
      console.error('Failed to create API keys:', error)
    } finally {
      setIsCreatingKeys(false)
    }
  }

  return (
    <AlertDialog open={createKeysDialogOpen} onOpenChange={setCreateKeysDialogOpen}>
      <Button onClick={() => setCreateKeysDialogOpen(true)}>Create new API keys</Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create new API keys</AlertDialogTitle>
          <AlertDialogDescription>
            This will create a default publishable key and a default secret key both named{' '}
            <code className="!break-keep text-code-inline">default</code>. These keys are required
            to connect your application to your Supabase project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCreateNewApiKeys} disabled={isCreatingKeys}>
            {isCreatingKeys ? 'Creating...' : 'Create keys'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
