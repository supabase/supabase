'use client'

import { useStartConfigSearchParams } from '~/features/start/useStartConfigSearchParams'
import { StartClient, type Template } from 'start'

interface StartPageClientProps {
  templates: Template[]
}

export function StartPageClient({ templates }: StartPageClientProps) {
  const configState = useStartConfigSearchParams(templates)

  return <StartClient templates={templates} configState={configState} />
}
