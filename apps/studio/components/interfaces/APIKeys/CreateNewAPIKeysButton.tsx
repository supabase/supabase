import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
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
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { getWriteGrantTooltip } from './APIKeys.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAPIKeyCreateMutation } from '@/data/api-keys/api-key-create-mutation'
import { useGrant } from '@/lib/grants'

export const CreateNewAPIKeysButton = () => {
  const { ref: projectRef } = useParams()

  const [createKeysDialogOpen, setCreateKeysDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createGrant = useGrant('POST /v1/projects/{ref}/api-keys', { projectRef })

  const { mutateAsync: createAPIKey } = useAPIKeyCreateMutation({ onError: () => {} })

  const handleCreateNewApiKeys = async () => {
    if (!projectRef) return
    if (!createGrant.grant) {
      toast.error(
        getWriteGrantTooltip(createGrant.status, 'create') ??
          'Still checking permissions to create API keys. Try again in a moment.'
      )
      return
    }

    try {
      setError(null)

      // Create publishable key
      try {
        await createAPIKey({
          projectRef,
          grant: createGrant.grant,
          type: 'publishable',
          name: 'default',
        })
      } catch (error: any) {
        setError(`Failed to create the default publishable key: ${error.message}`)
        throw error
      }

      // Create secret key
      try {
        await createAPIKey({
          projectRef,
          grant: createGrant.grant,
          type: 'secret',
          name: 'default',
        })
      } catch (error: any) {
        setError(
          `The default publishable key was created, but the default secret key failed: ${error.message}`
        )
        throw error
      }

      setCreateKeysDialogOpen(false)
      toast.success('Successfully created a new set of API keys!')
    } catch (error) {
      console.error('Failed to create API keys:', error)
      throw error
    }
  }

  return (
    <AlertDialog open={createKeysDialogOpen} onOpenChange={setCreateKeysDialogOpen}>
      <ButtonTooltip
        variant="primary"
        onClick={() => setCreateKeysDialogOpen(true)}
        disabled={createGrant.status !== 'granted'}
        tooltip={{
          content: { side: 'bottom', text: getWriteGrantTooltip(createGrant.status, 'create') },
        }}
      >
        Create new API keys
      </ButtonTooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create new API keys</AlertDialogTitle>
          <AlertDialogDescription>
            This will create a default publishable key and a default secret key both named{' '}
            <code className="break-keep!">default</code>. These keys are required to connect your
            application to your Supabase project. Your existing legacy API keys (
            <code className="break-keep!">anon</code> and{' '}
            <code className="break-keep!">service_role</code>) are not affected and remain valid
            until you disable them in a separate step.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <AlertDialogBody>
            <Admonition type="destructive" title="Unable to create API keys" description={error} />
          </AlertDialogBody>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCreateNewApiKeys}>Create keys</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
