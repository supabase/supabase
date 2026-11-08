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
  oauthApp?: OAuthClient
  onClose: () => void
}

export const NewOAuthAppModal = ({ oauthApp, onClose }: NewOAuthAppModalProps) => {
  const isVisible = Boolean(oauthApp?.client_secret)

  return (
    <Dialog open={isVisible}>
      <DialogContent
        size="small"
        hideClose
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Save your client secret</DialogTitle>
          <DialogDescription>
            Copy the client ID and secret now. The secret won&apos;t be shown again. If you lose it,
            regenerate the client secret.
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-4">
          <FormItemLayout label="Client ID" isReactForm={false}>
            <Input
              copy
              readOnly
              className="input-mono"
              value={oauthApp?.client_id ?? ''}
              onChange={() => {}}
              onCopy={() => toast.success('Client ID copied to clipboard')}
            />
          </FormItemLayout>
          <FormItemLayout label="Client secret" isReactForm={false}>
            <Input
              copy
              readOnly
              className="input-mono"
              value={oauthApp?.client_secret ?? ''}
              onChange={() => {}}
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
