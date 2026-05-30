import { RadioGroupStacked, RadioGroupStackedItem } from 'ui'

export default function RadioGroupDemo() {
  return (
    <RadioGroupStacked defaultValue="comfortable">
      <RadioGroupStackedItem
        value="default"
        id="r1"
        label="Default"
        description="The default option is the most spacious and comfortable."
      />
      <RadioGroupStackedItem
        value="comfortable"
        id="r2"
        label="Comfortable"
        description="The comfortable option is a bit more compact than the default option."
      />
      <RadioGroupStackedItem
        value="compact"
        id="r3"
        label="Compact"
        description="The compact option is the most compact and space-efficient."
      />
    </RadioGroupStacked>
  )
}
