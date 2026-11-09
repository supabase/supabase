import { SettingsIcon } from 'lucide-react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { Button, Checkbox, Label, Popover, PopoverContent, PopoverTrigger } from 'ui'

interface RowCreationOptionsProps {
  keepValues: boolean
  onKeepValuesChange: (keepValues: boolean) => void
}

export const RowCreationOptions = ({ keepValues, onKeepValuesChange }: RowCreationOptionsProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="text"
          className="px-1.5"
          icon={<SettingsIcon />}
          aria-label="Row creation options"
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        // Keeps the notch clear of the popover's rounded corner when it sits near the left edge
        arrowPadding={12}
        side="top"
        // Radix adds the arrow's height to this offset, so the notch ends just above the trigger
        sideOffset={1}
        collisionPadding={16}
        className="w-72"
      >
        {/* A rotated square bordered on its two outer edges, centered on the popover's border so the
            notch continues the border. Radix positions it over the trigger. It sits outside the
            spacing container below, because a sibling margin would shift it off the border. */}
        <PopoverPrimitive.Arrow asChild>
          <div className="size-3 -translate-y-1/2 rotate-45 border-b border-r border-overlay bg-overlay" />
        </PopoverPrimitive.Arrow>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Row creation options</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-x-3">
              <Checkbox
                id="keep-values"
                checked={keepValues}
                onCheckedChange={(checked) => onKeepValuesChange(checked === true)}
              />
              <Label htmlFor="keep-values" className="text-sm font-normal text-foreground">
                Keep values for the next row
              </Label>
            </div>
            {/* Indented to line up with the label: checkbox (size-4) + gap-x-3 */}
            <p className="pl-7 text-xs text-foreground-lighter">
              Pre-fill the form with the current values when adding another row.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
