import { Check, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'

import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useRouter } from 'next/router'
import {
  Badge,
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

interface ModelSelectorProps {
  selectedModel: 'gpt-5' | 'gpt-5-mini'
  onSelectModel: (model: 'gpt-5' | 'gpt-5-mini') => void
}

export const ModelSelector = ({ selectedModel, onSelectModel }: ModelSelectorProps) => {
  const router = useRouter()
  const { data: organization } = useSelectedOrganizationQuery()
  const { billingAll } = useIsFeatureEnabled(['billing:all'])

  const [open, setOpen] = useState(false)

  const canAccessGpt5 = organization?.plan?.id !== 'free'
  const slug = organization?.slug ?? '_'

  const upgradeHref = billingAll
    ? `/org/${slug}/billing?panel=subscriptionPlan&source=ai-assistant-model`
    : `/support/new?slug=${slug}&projectRef=no-project&category=Plan_upgrade&subject=${encodeURIComponent('Enquiry to upgrade to Pro plan for organization')}&message=${encodeURIComponent(`Name: ${organization?.name ?? ''}\nSlug: ${organization?.slug ?? ''}\nRequested plan: Pro`)}`

  const handleSelectModel = (model: 'gpt-5' | 'gpt-5-mini') => {
    if (model === 'gpt-5' && !canAccessGpt5) {
      setOpen(false)
      void router.push(upgradeHref)
      return
    }

    onSelectModel(model)
    setOpen(false)
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="outline"
          className="text-foreground-light"
          iconRight={<ChevronsUpDown strokeWidth={1} size={12} />}
        >
          {selectedModel}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-44" align="start" side="top">
        <Command_Shadcn_>
          <CommandList_Shadcn_>
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_
                value="gpt-5-mini"
                onSelect={() => handleSelectModel('gpt-5-mini')}
                className="flex justify-between"
              >
                <span>gpt-5-mini</span>
                {selectedModel === 'gpt-5-mini' && <Check className="h-3.5 w-3.5" />}
              </CommandItem_Shadcn_>
              <CommandItem_Shadcn_
                value="gpt-5"
                onSelect={() => handleSelectModel('gpt-5')}
                className="flex justify-between"
              >
                <span>gpt-5</span>
                {canAccessGpt5 ? (
                  selectedModel === 'gpt-5' ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : null
                ) : (
                  <Badge variant="warning">Upgrade</Badge>
                )}
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
