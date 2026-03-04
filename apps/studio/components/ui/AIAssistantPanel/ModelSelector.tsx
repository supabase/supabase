import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
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
  TooltipContent,
  TooltipTrigger,
  Tooltip,
} from 'ui'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'

interface ModelSelectorProps {
  selectedModel: 'gpt-5' | 'gpt-5-mini'
  onSelectModel: (model: 'gpt-5' | 'gpt-5-mini') => void
}

export const ModelSelector = ({ selectedModel, onSelectModel }: ModelSelectorProps) => {
  const router = useRouter()
  const { data: organization } = useSelectedOrganizationQuery()
  const { hasAccess: hasAccessToAdvanceModel, isLoading: isLoadingEntitlements } =
    useCheckEntitlements('assistant.advance_model')

  const [open, setOpen] = useState(false)

  const slug = organization?.slug ?? '_'

  const upgradeHref = `/org/${slug ?? '_'}/billing?panel=subscriptionPlan&source=ai-assistant-model`

  const handleSelectModel = (model: 'gpt-5' | 'gpt-5-mini') => {
    if (model === 'gpt-5' && !hasAccessToAdvanceModel) {
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
                {hasAccessToAdvanceModel ? (
                  selectedModel === 'gpt-5' ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : null
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Badge role="button" variant="warning">
                          Upgrade
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      gpt-5 is available on Pro plans and above
                    </TooltipContent>
                  </Tooltip>
                )}
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
