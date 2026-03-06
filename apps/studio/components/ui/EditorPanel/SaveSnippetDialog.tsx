import { useParams } from 'common'
import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { generateSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckOpenAIKeyQuery } from 'data/ai/check-api-key-query'
import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  AiIconAnimation,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Input_Shadcn_,
  Label_Shadcn_,
} from 'ui'

interface SaveSnippetDialogProps {
  open: boolean
  sql: string
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
}

export const SaveSnippetDialog = ({ open, sql, onOpenChange, onSave }: SaveSnippetDialogProps) => {
  const { ref } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: subscription } = useOrgSubscriptionQuery(
    { orgSlug: organization?.slug },
    { enabled: open }
  )
  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef: ref })
  const { data: check } = useCheckOpenAIKeyQuery()

  const [name, setName] = useState(generateSnippetTitle())

  const isApiKeySet = !!check?.hasKey
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription) && projectSettings?.is_sensitive

  const { mutate: generateTitle, isPending: isGenerating } = useSqlTitleGenerateMutation({
    onSuccess: ({ title }) => setName(title),
    onError: (error) => toast.error(`Failed to generate title: ${error.message}`),
  })

  // Reset the name each time the dialog opens
  useEffect(() => {
    if (open) setName(generateSnippetTitle())
  }, [open])

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Save snippet</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-4 py-5">
          <div className="flex flex-col gap-y-2">
            <Label_Shadcn_ htmlFor="snippet-name">Name</Label_Shadcn_>
            <Input_Shadcn_
              id="snippet-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
            />
          </div>
          {!hasHipaaAddon && (
            <div className="flex justify-end">
              <ButtonTooltip
                type="default"
                size="tiny"
                disabled={isGenerating || !isApiKeySet}
                onClick={() => generateTitle({ sql })}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: isApiKeySet
                      ? undefined
                      : 'Add your "OPENAI_API_KEY" to your environment variables to use this feature.',
                  },
                }}
              >
                <div className="flex items-center gap-1">
                  <div className="scale-75">
                    <AiIconAnimation loading={isGenerating} />
                  </div>
                  <span>Generate with AI</span>
                </div>
              </ButtonTooltip>
            </div>
          )}
        </DialogSection>
        <DialogSectionSeparator />
        <DialogFooter className="px-5 py-4">
          <Button type="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!name.trim()} onClick={handleSave}>
            Save snippet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
