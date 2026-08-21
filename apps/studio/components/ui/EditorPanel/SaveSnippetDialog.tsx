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
  Input,
  Label,
} from 'ui'

import { generateSnippetTitle } from '@/components/interfaces/SQLEditor/SQLEditor.constants'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useCheckOpenAIKeyQuery } from '@/data/ai/check-api-key-query'
import { useSqlTitleGenerateMutation } from '@/data/ai/sql-title-mutation'
import { useOrgAiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

interface SaveSnippetDialogProps {
  open: boolean
  sql: string
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
}

export const SaveSnippetDialog = ({ open, sql, onOpenChange, onSave }: SaveSnippetDialogProps) => {
  const { data: check } = useCheckOpenAIKeyQuery()

  const [name, setName] = useState(generateSnippetTitle())

  const isApiKeySet = !!check?.hasKey

  // Orgs on HIPAA plans or that have disabled AI should not have access to Supabase AI
  const { aiOptInLevel, isHipaaProjectDisallowed } = useOrgAiOptInLevel()
  const isAiOptedOut = aiOptInLevel === 'disabled'

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
            <Label htmlFor="snippet-name">Name</Label>
            <Input
              id="snippet-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
            />
          </div>
          <div className="flex justify-end">
            <ButtonTooltip
              variant="default"
              size="tiny"
              disabled={isGenerating || !isApiKeySet || isHipaaProjectDisallowed || isAiOptedOut}
              onClick={() => generateTitle({ sql })}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: isHipaaProjectDisallowed
                    ? 'This feature is not available for HIPAA projects.'
                    : isAiOptedOut
                      ? 'Your organization has opted out of AI features.'
                      : isApiKeySet
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
        </DialogSection>
        <DialogSectionSeparator />
        <DialogFooter className="px-5 py-4">
          <Button variant="default" onClick={() => onOpenChange(false)}>
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
