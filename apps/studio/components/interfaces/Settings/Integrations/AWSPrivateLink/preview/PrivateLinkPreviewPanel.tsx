/**
 * Prototype-only floating presenter. Enable with `?privatelinkPreview=1`.
 */

import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from 'ui'

import {
  PRIVATE_LINK_PREVIEW_QUERY,
  PRIVATE_LINK_PREVIEW_SCENARIOS,
  type PrivateLinkPreviewScenario,
} from './privateLinkPreview.constants'
import { privateLinkPreviewState, usePrivateLinkPreview } from './privateLinkPreview.store'

export function replayPrivateLinkAddedToast() {
  toast.success('Connection added')
}

export const PrivateLinkPreviewPanel = () => {
  const preview = usePrivateLinkPreview()

  useEffect(() => {
    privateLinkPreviewState.hydrate()
  }, [])

  if (!preview.enabled) return null

  const realApiScenarios = PRIVATE_LINK_PREVIEW_SCENARIOS.filter(
    (scenario) => scenario.source === 'real-api'
  )
  const mockedScenarios = PRIVATE_LINK_PREVIEW_SCENARIOS.filter(
    (scenario) => scenario.source === 'mocked-platform'
  )

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)]">
      <Card className="border-warning-500 bg-surface-100 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">PrivateLink preview</CardTitle>
          <p className="text-xs text-foreground-lighter">
            Prototype only. Off unless the URL has `{PRIVATE_LINK_PREVIEW_QUERY}=1`. Do not ship.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={preview.scenario}
            onValueChange={(value) =>
              privateLinkPreviewState.setScenario(value as PrivateLinkPreviewScenario)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a scenario" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Real API states</SelectLabel>
                {realApiScenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Mocked platform</SelectLabel>
                {mockedScenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <p className="text-xs text-foreground-light">{preview.config.description}</p>
          <p className="text-xs text-foreground-muted">
            {preview.config.source === 'real-api' ? 'Real API' : 'Mocked platform'}
          </p>

          {preview.b5Note && (
            <p className="text-xs text-foreground-light border-l-2 border-warning-500 pl-2">
              {preview.b5Note}
            </p>
          )}

          {preview.scenario === 'aws-direct-waiting' && (
            <Button variant="default" size="tiny" onClick={replayPrivateLinkAddedToast}>
              Replay add toast
            </Button>
          )}

          <Button
            size="tiny"
            variant="outline"
            onClick={() => privateLinkPreviewState.setEnabled(false)}
          >
            Dismiss preview
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
