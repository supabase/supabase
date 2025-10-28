import { useState } from 'react'
import { Button, Card, CardContent } from 'ui'
import { PixelGame } from './components/PixelGame'
import { SurvivalShooter } from './components/SurvivalShooter'
import { Cuboid, Target } from 'lucide-react'

interface AdvisorEmptyProps {
  availableResources?: number
}

type ActiveGame = 'pixel' | 'survival' | null

export const AdvisorEmpty = ({ availableResources = 10 }: AdvisorEmptyProps) => {
  const [activeGame, setActiveGame] = useState<ActiveGame>(null)

  // if (activeGame === 'pixel') {
  //   return (
  //     <Card className="bg-transparent">
  //       <CardContent className="relative p-0 h-[256px] overflow-hidden">
  //         <PixelGame availableResources={availableResources} onExit={() => setActiveGame(null)} />
  //       </CardContent>
  //     </Card>
  //   )
  // }

  if (activeGame === 'survival') {
    return (
      <Card className="bg-transparent">
        <CardContent className="relative p-0 h-[256px] overflow-hidden">
          <SurvivalShooter
            availableResources={availableResources}
            onExit={() => setActiveGame(null)}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-transparent">
      <CardContent className="relative p-0 h-[256px] overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <Button
            onClick={() => setActiveGame('pixel')}
            type="text"
            size="tiny"
            className="w-6 h-6"
            icon={<Cuboid strokeWidth={1} size={16} />}
          />
          <Button
            onClick={() => setActiveGame('survival')}
            type="text"
            size="tiny"
            className="w-6 h-6"
            icon={<Target strokeWidth={1} size={16} />}
          />
        </div>
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
