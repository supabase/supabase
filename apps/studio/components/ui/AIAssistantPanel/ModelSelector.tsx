import { Check, ChevronsUpDown } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Badge,
  Button,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          className="text-foreground-light"
          iconRight={<ChevronsUpDown strokeWidth={1} size={12} />}
        >
          {selectedModel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-44" align="start" side="top">
        <Command>
          <CommandList>
            <CommandGroup>
              {ASSISTANT_MODELS.map((m) => (
                <CommandItem
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
                          <Badge variant="warning">Upgrade</Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {m.id} is available on Pro plans and above
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    selectedModel === m.id && <Check className="h-3.5 w-3.5" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
