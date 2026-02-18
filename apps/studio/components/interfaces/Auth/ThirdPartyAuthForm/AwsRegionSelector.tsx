import { Check, ChevronsUpDown } from 'lucide-react'
import { useId, useState } from 'react'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  FormControl_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'

// copied from https://docs.aws.amazon.com/general/latest/gr/cognito_identity.html
export const AWS_IDP_REGIONS = [
  'af-south-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-south-1 ',
  'ap-south-2 ',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-southeast-3',
  'ap-southeast-4',
  'ca-central-1',
  'eu-central-1',
  'eu-central-2',
  'eu-north-1',
  'eu-south-1',
  'eu-south-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'il-central-1',
  'me-central-1',
  'me-south-1',
  'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-gov-west-1',
  'us-west-1',
  'us-west-2',
]

export const AwsRegionSelector = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) => {
  const [open, setOpen] = useState(false)
  const listboxId = useId()

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <FormControl_Shadcn_>
          <Button
            type="default"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            className={cn('w-full justify-between', !value && 'text-muted-foreground')}
            size="small"
            iconRight={
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" strokeWidth={1} />
            }
          >
            {value ?? 'Select a region'}
          </Button>
        </FormControl_Shadcn_>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ id={listboxId} className="p-0" sameWidthAsTrigger>
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search AWS regions..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No regions found.</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              <ScrollArea className="h-72">
                {AWS_IDP_REGIONS.map((option) => (
                  <CommandItem_Shadcn_
                    value={option}
                    key={option}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? '' : currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4', option === value ? 'opacity-100' : 'opacity-0')}
                    />
                    {option}
                  </CommandItem_Shadcn_>
                ))}
              </ScrollArea>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
