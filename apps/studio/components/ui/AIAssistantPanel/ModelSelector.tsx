import { Check, ChevronsUpDown } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Badge,
  Button,
  Command_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { ASSISTANT_MODELS, isAdvanceOnlyModelId } from '@/lib/ai/model.utils'
import type { AssistantModelId } from '@/lib/ai/model.utils'

interface ModelSelectorProps {
  selectedModel: AssistantModelId
  onSelectModel: (model: AssistantModelId) => void
}

export const ModelSelector = ({ selectedModel, onSelectModel }: ModelSelectorProps) => {
  const router = useRouter()
  const { data: organization } = useSelectedOrganizationQuery()
  const { hasAccess: hasAccessToAdvanceModel, isLoading: isLoadingEntitlements } =
    useCheckEntitlements('assistant.advance_model')

  const [open, setOpen] = useState(false)

  const slug = organization?.slug ?? '_'

  const upgradeHref = `/org/${slug}/billing?panel=subscriptionPlan&source=ai-assistant-model`

  const handleSelectModel = (modelId: AssistantModelId) => {
    if (isLoadingEntitlements && isAdvanceOnlyModelId(modelId)) {
      return
    }
    if (isAdvanceOnlyModelId(modelId) && !hasAccessToAdvanceModel) {
      setOpen(false)
      void router.push(upgradeHref)
      return
    }

    onSelectModel(modelId)
    setOpen(false)
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="default"
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
              {ASSISTANT_MODELS.map((m) => (
                <CommandItem_Shadcn_
                  key={m.id}
                  value={m.id}
                  disabled={isLoadingEntitlements && isAdvanceOnlyModelId(m.id)}
                  onSelect={() => handleSelectModel(m.id)}
                  className="flex justify-between"
                >
                  <span>{m.id}</span>
                  {isAdvanceOnlyModelId(m.id) &&
                  !hasAccessToAdvanceModel &&
                  !isLoadingEntitlements ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Badge role="button" variant="warning">
                            Upgrade
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {m.id} is available on Pro plans and above
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    selectedModel === m.id && <Check className="h-3.5 w-3.5" />
                  )}
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
