import { RadioGroupCard, RadioGroupCardItem } from 'ui'

export default function RadioGroupDemo() {
  return (
    <RadioGroupCard defaultValue="comfortable" className="flex flex-wrap gap-3">
      <RadioGroupCardItem value="default" id="r1" label="Default" />
      <RadioGroupCardItem value="comfortable" id="r2" label="Comfortable" />
      <RadioGroupCardItem value="compact" id="r3" label="Compact" />
    </RadioGroupCard>
  )
}
