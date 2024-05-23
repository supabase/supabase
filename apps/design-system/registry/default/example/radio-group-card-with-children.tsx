import { RadioGroupCard, RadioGroupCardItem } from 'ui'
import SVG from 'react-inlinesvg'

export default function RadioGroupDemo() {
  const singleThemes = [
    { name: 'Dark', value: 'dark' }, // Classic Supabase dark
    { name: 'Deep Dark', value: 'deep-dark' }, // Deep Dark Supabase dark
    { name: 'Light', value: 'light' }, // Classic Supabase light
    { name: 'System', value: 'system' }, // Classic Supabase light
  ] as const

  return (
    <RadioGroupCard defaultValue="comfortable" className="flex flex-wrap gap-3">
      {singleThemes.map((theme) => (
        <RadioGroupCardItem key={theme.value} value={theme.value} label={theme.name}>
          <SVG src={`${process.env.NEXT_PUBLIC_BASE_PATH}/img/themes/${theme.value}.svg`} />
        </RadioGroupCardItem>
      ))}
    </RadioGroupCard>
  )
}
