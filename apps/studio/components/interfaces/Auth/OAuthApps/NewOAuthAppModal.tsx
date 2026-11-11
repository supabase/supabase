import type { OAuthClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface NewOAuthAppModalProps {
  oauthApp: OAuthClient | undefined
  onClose: () => void
}

/**
 * Shows the credentials of a newly created OAuth app, or of an app whose secret was regenerated.
 * The client secret can't be retrieved again, so the modal can only be dismissed with "Done".
 */
export const NewOAuthAppModal = ({ oauthApp, onClose }: NewOAuthAppModalProps) => {
  const isOpen = !!oauthApp?.client_secret

  return (
    <Dialog open={isOpen}>
      <DialogContent
        size="small"
        hideClose
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Save your client secret</DialogTitle>
          <DialogDescription>
            Copy the client ID and secret for {oauthApp?.client_name} now. The secret won't be shown
            again. If you lose it, regenerate it from the app's settings.
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-4">
          <FormItemLayout label="Client ID" isReactForm={false}>
            <Input
              copy
              readOnly
              className="input-mono"
              value={oauthApp?.client_id}
              onCopy={() => toast.success('Client ID copied to clipboard')}
            />
          </FormItemLayout>
          <FormItemLayout label="Client secret" isReactForm={false}>
            <Input
              copy
              readOnly
              className="input-mono"
              value={oauthApp?.client_secret}
              onCopy={() => toast.success('Client secret copied to clipboard')}
            />
          </FormItemLayout>
        </DialogSection>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
