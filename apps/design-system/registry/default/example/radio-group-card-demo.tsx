import { RadioGroupCard, RadioGroupCardItem } from 'ui'

export default function RadioGroupDemo() {
  return (
    <RadioGroupCard defaultValue="comfortable" className="flex flex-wrap gap-3" aria-label="Size">
      <RadioGroupCardItem value="default" label="Default" />
      <RadioGroupCardItem value="comfortable" label="Comfortable" />
      <RadioGroupCardItem value="compact" label="Compact" />
    </RadioGroupCard>
  )
}
