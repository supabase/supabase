import { useState } from 'react'
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
  DialogTrigger,
  Label_Shadcn_,
} from 'ui'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

export default function MultiSelectDemo() {
  const [selectedValues, setSelectedValues] = useState<string[]>([])

  const fruits = [
    { value: 'Apple', isDisabled: false },
    { value: 'Banana', isDisabled: false },
    { value: 'Cherry', isDisabled: false },
    { value: 'Date', isDisabled: false },
    { value: 'Elderberrie', isDisabled: false },
    { value: 'Fig', isDisabled: false },
    { value: 'Grape', isDisabled: false },
    { value: 'Kiwi', isDisabled: true },
    { value: 'Mango', isDisabled: false },
    { value: 'Strawberry', isDisabled: false },
  ]

  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose your fruits</DialogTitle>
          <DialogDescription>Select the fruits you like.</DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="space-y-4">
          <div>
            <Label_Shadcn_ htmlFor="fruits">Fruits</Label_Shadcn_>
            <MultiSelector id="fruits" values={selectedValues} onValuesChange={setSelectedValues}>
              <MultiSelectorTrigger label="Select fruits" badgeLimit="wrap" showIcon={false} />
              <MultiSelectorContent>
                <MultiSelectorList>
                  {fruits.map(({ value, isDisabled }) => (
                    <MultiSelectorItem key={value} value={value} disabled={isDisabled}>
                      {value}
                    </MultiSelectorItem>
                  ))}
                </MultiSelectorList>
              </MultiSelectorContent>
            </MultiSelector>
          </div>
        </DialogSection>
        <DialogFooter>
          <Button>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
