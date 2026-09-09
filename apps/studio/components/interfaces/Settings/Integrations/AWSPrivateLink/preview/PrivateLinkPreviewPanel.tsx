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
  PRIVATE_LINK_PREVIEW_GROUPS,
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

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 max-w-[calc(100vw-2rem)]">
      <Card className="border-warning-500 bg-surface-100 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">PrivateLink preview</CardTitle>
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
              {PRIVATE_LINK_PREVIEW_GROUPS.map((group) => (
                <SelectGroup key={group.id}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {PRIVATE_LINK_PREVIEW_SCENARIOS.filter(
                    (scenario) => scenario.group === group.id
                  ).map((scenario) => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      {scenario.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          <p className="text-xs text-foreground-light">{preview.config.description}</p>

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
            Dismiss
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
