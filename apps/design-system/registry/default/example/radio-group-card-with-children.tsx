import SVG from 'react-inlinesvg'
import { RadioGroupCard, RadioGroupCardItem } from 'ui'

import { BASE_PATH } from '@/lib/constants'

export default function RadioGroupDemo() {
  const singleThemes = [
    { name: 'Dark', value: 'dark' }, // Classic Supabase dark
    { name: 'Classic dark', value: 'classic-dark' }, // Deep Dark Supabase dark
    { name: 'Light', value: 'light' }, // Classic Supabase light
    { name: 'System', value: 'system' }, // Classic Supabase light
  ] as const

  return (
    <RadioGroupCard defaultValue="dark" className="flex flex-wrap gap-3" aria-label="Theme">
      {singleThemes.map((theme) => (
        <RadioGroupCardItem key={theme.value} value={theme.value} label={theme.name}>
          <SVG src={`${BASE_PATH}/img/themes/${theme.value}.svg`} />
        </RadioGroupCardItem>
      ))}
    </RadioGroupCard>
  )
}
