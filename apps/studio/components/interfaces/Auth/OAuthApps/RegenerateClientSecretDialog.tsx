import { useParams } from 'common'
import { useOAuthServerAppRegenerateSecretMutation } from 'data/oauth-server-apps/oauth-server-app-regenerate-secret-mutation'
import { useSupabaseClientQuery } from 'hooks/use-supabase-client-query'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Input,
  Separator,
} from 'ui'

interface RegenerateClientSecretDialogProps {
  visible: boolean
  onClose: () => void
  clientId: string
  clientSecret: string
}

export const RegenerateClientSecretDialog = ({
  visible,
  onClose,
  clientId,
  clientSecret,
}: RegenerateClientSecretDialogProps) => {
  const { ref: projectRef } = useParams()

  const { data: supabaseClientData } = useSupabaseClientQuery({ projectRef })

  const { mutateAsync: regenerateSecret, isLoading } = useOAuthServerAppRegenerateSecretMutation()

  const onRegenerate = async () => {
    if (!projectRef || !supabaseClientData) return

    try {
      await regenerateSecret({
        projectRef,
        supabaseClient: supabaseClientData.supabaseClient,
        clientId,
        temporaryApiKey: supabaseClientData.temporaryApiKey,
      })
      onClose()
    } catch (error) {
      console.error('Failed to regenerate client secret:', error)
    }
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">Regenerated OAuth App Credentials</DialogTitle>
        </DialogHeader>
        <Separator />
        <DialogSection>
          <div className="space-y-4">
            <Input readOnly copy className="input-mono" value={clientId} />
            <Input readOnly copy className="input-mono" value={clientSecret} />
            <p className="text-xs text-foreground-light mt-2">
              Make sure to copy your new client secret now. You won’t be able to see it again!
            </p>
          </div>
        </DialogSection>
        <DialogFooter>
          <Button type="default" onClick={onClose}>
            Close
          </Button>
          <Button type="warning" onClick={onRegenerate} loading={isLoading}>
            Regenerate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
