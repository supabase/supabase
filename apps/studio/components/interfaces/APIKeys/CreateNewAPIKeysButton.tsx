import { useParams } from 'common'
import { useState } from 'react'
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
import { useAPIKeyCreateMutation } from 'data/api-keys/api-key-create-mutation'
import { ExternalLink } from 'lucide-react'
import { useApiKeysVisibility } from './hooks/useApiKeysVisibility'

export const CreateNewAPIKeysButton = () => {
  const { ref: projectRef } = useParams()
  const [createKeysDialogOpen, setCreateKeysDialogOpen] = useState(false)
  const [isCreatingKeys, setIsCreatingKeys] = useState(false)

  const { canInitApiKeys, isInRollout, hasApiKeys } = useApiKeysVisibility()
  const { mutate: createAPIKey } = useAPIKeyCreateMutation()

  const handleCreateNewApiKeys = async () => {
    if (!projectRef) return
    setIsCreatingKeys(true)

    try {
      // Create publishable key
      await createAPIKey({
        projectRef,
        type: 'publishable',
        description: 'Default publishable key',
      })

      // Create secret key
      await createAPIKey({
        projectRef,
        type: 'secret',
        description: 'default',
      })

      setCreateKeysDialogOpen(false)
    } catch (error) {
      console.error('Failed to create API keys:', error)
    } finally {
      setIsCreatingKeys(false)
    }
  }

  // Don't show anything if not in rollout or if can't initialize keys
  if (!isInRollout) {
    return null
  }

  return (
    <div className="mb-8">
      {canInitApiKeys && (
        <AlertDialog open={createKeysDialogOpen} onOpenChange={setCreateKeysDialogOpen}>
          <Button onClick={() => setCreateKeysDialogOpen(true)}>Create new API keys</Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create new API keys</AlertDialogTitle>
              <AlertDialogDescription>
                This will create a default publishable key and a default secret key called
                'default'. These keys are needed to connect your application to your Supabase
                project.
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
      )}

      {hasApiKeys && (
        <div className="w-full flex flex-col xl:flex-row border py-10 pl-10 rounded-md">
          <div className="flex flex-col gap-0 z-[2]">
            <p className="text-sm text-foreground">These are the new API keys</p>
            <p className="text-sm text-foreground-lighter">
              We've updated our API keys to better support your application needs. Have feedback?{' '}
              <a
                href="https://github.com/supabase/supabase/discussions"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-brand"
              >
                Join the discussion on GitHub <ExternalLink size={14} strokeWidth={1.5} />
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
