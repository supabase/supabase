import { cn } from 'ui'
import { useThreeJS } from './helpers'
import { useCallback, useRef } from 'react'
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
  const sceneRef = useRef<TicketScene | null>(null)
  const setup = useCallback(
    (container: HTMLElement) => {
      let scene: BaseScene | null = null

      const sceneRenderer = new SceneRenderer(container)

      sceneRef.current = new TicketScene({
        defaultSecret: secret,
        defaultPlatinum: platinum,
        user,
        startDate,
      })

      sceneRenderer.activateScene(sceneRef.current)

      sceneRenderer.init()

      return sceneRenderer
    },
    [platinum, secret, startDate, user]
  )

  const { containerRef } = useThreeJS(setup)
  return (
    <div
      className={cn(
        'w-screen absolute inset-0 h-[600px] lg:min-h-full lg:max-h-[1000px] flex justify-center items-center overflow-hidden',
        className
      )}
    >
      <div
        ref={containerRef}
        className="w-full lg:h-full"
        onClick={() => {
          sceneRef.current?.showSecondFace()
        }}
      />
    </div>
  )
}

export default TicketCanvas
