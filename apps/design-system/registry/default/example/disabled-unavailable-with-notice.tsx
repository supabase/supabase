'use client'

import { CirclePause } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

const UNAVAILABLE_REASON = 'Pausing is unavailable on High Availability projects'

export default function DisabledUnavailableWithNotice() {
  const unavailable = true

  return (
    <Card className="max-w-lg">
      <CardHeader className="border-b-0">
        <CardTitle>Pause project</CardTitle>
      </CardHeader>
      <Admonition
        type="default"
        layout="horizontal"
        title="High Availability project"
        description="Some infrastructure actions are unavailable on High Availability projects."
        className="mb-0 rounded-none border-x-0"
      />
      <CardContent className="flex justify-end pt-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              icon={<CirclePause />}
              disabled={unavailable}
              focusableWhenDisabled
            >
              Pause project
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{UNAVAILABLE_REASON}</TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  )
}
