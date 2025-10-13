import { useEffect, useState } from 'react'
import { Card, CardContent } from 'ui'
import { AdvisorGame } from './components/AdvisorGame'
import { ResourceCounter } from './components/ResourceCounter'
import { useAdvisorGameStore } from './hooks/useAdvisorGameStore'

interface AdvisorEmptyProps {
  availableResources?: number
}

export const AdvisorEmpty = ({ availableResources = 20 }: AdvisorEmptyProps) => {
  const [isGameActive, setIsGameActive] = useState(false)
  const setResources = useAdvisorGameStore((state) => state.setResources)

  useEffect(() => {
    setResources(availableResources)
  }, [availableResources, setResources])

  const handleEnterGame = () => {
    setIsGameActive(true)
  }

  return (
    <Card className="bg-transparent">
      <CardContent className="relative p-0 h-[256px] overflow-hidden flex flex-col items-center justify-center">
        {!isGameActive && <ResourceCounter onClick={handleEnterGame} />}
        {isGameActive ? (
          <AdvisorGame availableResources={availableResources} />
        ) : (
          <div className="text-center">
            <div className="heading-default mb-1">You&apos;re all caught up</div>
            <p className="text-sm text-foreground-light">
              Advisor found no pending security or performance issues
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
