'use client'

import { OpenInV0Button } from '@/components/open-in-v0-button'
import { type Provider } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Label_Shadcn_, Switch } from 'ui'

//The dynamic import is to prevent the command component from being rendered on the server and cause hydration errors
const Command = dynamic(() => import('./command').then((mod) => mod.Command), { ssr: false })

interface BlockItemProps {
  name: string
}

const PROVIDERS: { label: string; value: Provider | 'password' }[] = [
  { label: 'Password', value: 'password' },
  { label: 'Google', value: 'google' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Apple', value: 'apple' },
  { label: 'Azure (Microsoft)', value: 'azure' },
  { label: 'Twitter', value: 'twitter' },
  { label: 'GitHub', value: 'github' },
  { label: 'Gitlab', value: 'gitlab' },
  { label: 'Bitbucket', value: 'bitbucket' },
  { label: 'Discord', value: 'discord' },
  { label: 'Figma', value: 'figma' },
  { label: 'Kakao', value: 'kakao' },
  { label: 'Keycloak', value: 'keycloak' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Notion', value: 'notion' },
  { label: 'Slack', value: 'slack' },
  { label: 'Spotify', value: 'spotify' },
  { label: 'Twitch', value: 'twitch' },
  { label: 'WorkOS', value: 'workos' },
  { label: 'Zoom', value: 'zoom' },
]

export const GeneratedAuthBlockItem = ({
  name = 'social-auth-nextjs',
}: {
  name?: string
  description?: string
}) => {
  const [selected, setSelected] = useState<string[]>([])

  const handleChange = (provider: string) => {
    setSelected((prev: string[]) =>
      prev.includes(provider) ? prev.filter((p) => p !== provider) : [...prev, provider]
    )
  }

  const url = `nextjs-${selected.join('-')}`

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-4 py-4">
        {PROVIDERS.map((provider) => (
          <Label_Shadcn_ key={provider.value} className="flex items-center">
            <Switch
              checked={selected.includes(provider.value)}
              onCheckedChange={() => handleChange(provider.value)}
              className="mr-2"
            />
            {provider.label}
          </Label_Shadcn_>
        ))}
      </div>

      <Command name={url} highlight />
      <OpenInV0Button name={name} className="w-fit shrink-0 mt-4" />
    </div>
  )
}
