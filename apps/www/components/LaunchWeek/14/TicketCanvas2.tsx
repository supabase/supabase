import { cn } from 'ui'
import { useThreeJS } from './helpers'
import { useCallback } from 'react'
import SceneRenderer, { BaseScene } from './utils/SceneRenderer'
import TicketScene from './scenes/TicketScene'

interface TicketCanvasProps {
  secret?: boolean
  platinum?: boolean
  user: {
    id?: string
    name?: string
    ticketNumber?: number
  }
  startDate: Date
  playmodeRTChannel: unknown
  className?: string
  onUpgrade?: () => void
}
const TicketCanvas = ({
  secret,
  platinum,
  user,
  startDate,
  playmodeRTChannel,
  className,
  onUpgrade,
}: TicketCanvasProps) => {
  const setup = useCallback((container: HTMLElement) => {
    let scene: BaseScene | null = null

    const sceneRenderer = new SceneRenderer(container)

    sceneRenderer.activateScene(new TicketScene({
      defaultSecret: secret,
      defaultPlatinum: platinum,
      user,
      startDate
    }))

    sceneRenderer.init()

    return sceneRenderer
  }, [platinum, secret, startDate, user])

  const { containerRef } = useThreeJS(setup)
  return (
    <div
      className={cn(
        'w-screen absolute inset-0 h-[600px] lg:min-h-full lg:max-h-[1000px] flex justify-center items-center overflow-hidden pointer-events-none',
        className
      )}
    >
      <div ref={containerRef} className="w-full lg:h-full" />
    </div>
  )
}

export default TicketCanvas
