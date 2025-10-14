import { useState } from 'react'
import { Button, Card, CardContent } from 'ui'
import { PixelGame } from './components/PixelGame'
import { Cuboid } from 'lucide-react'

interface AdvisorEmptyProps {
  availableResources?: number
}

export const AdvisorEmpty = ({ availableResources = 20 }: AdvisorEmptyProps) => {
  const [isGameActive, setIsGameActive] = useState(false)

  if (isGameActive) {
    return (
      <Card className="bg-transparent">
        <CardContent className="relative p-0 h-[256px] overflow-hidden">
          <PixelGame
            availableResources={availableResources}
            onExit={() => setIsGameActive(false)}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-transparent">
      <CardContent className="relative p-0 h-[256px] overflow-hidden flex flex-col items-center justify-center">
        <Button
          onClick={setIsGameActive}
          type="text"
          size="tiny"
          className="absolute top-3 left-3 z-10 w-6 h-6"
          icon={<Cuboid strokeWidth={1} size={16} />}
        />
        <div className="text-center space-y-4">
          <div>
            <div className="heading-default mb-1">You&apos;re all caught up</div>
            <p className="text-sm text-foreground-light">
              Advisor found no pending security or performance issues
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
