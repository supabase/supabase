import { cn } from 'ui'
import { useThreeJS } from './helpers'
import { useCallback, useEffect, useRef } from 'react'
import SceneRenderer, { BaseScene } from './utils/SceneRenderer'
import TicketScene from './scenes/TicketScene'
import TunnelScene from './scenes/TunnelScene'

interface TicketCanvasProps {
  visible: boolean
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
  visible,
  secret,
  platinum,
  user,
  startDate,
  playmodeRTChannel,
  className,
  onUpgrade,
}: TicketCanvasProps) => {
  const sceneRef = useRef<TicketScene | null>(null)
  const tunnelRef = useRef<TunnelScene | null>(null)
  const setup = useCallback(
    (container: HTMLElement) => {
      const sceneRenderer = new SceneRenderer(container)

      void sceneRenderer.init(async () => {
        sceneRef.current = new TicketScene({
          defaultSecret: secret,
          defaultPlatinum: platinum,
          user,
          startDate,
          onSeatChartButtonClicked: () => {
            sceneRef.current?.showBackSide()
            sceneRef.current?.upgradeToSecret()
          },
          onGoBackButtonClicked: () => {
            sceneRef.current?.showFrontSide()
          },
        })

        tunnelRef.current = new TunnelScene({
          defaultVisible: true,
        })
        await sceneRenderer.activateScene(sceneRef.current, true)
        await sceneRenderer.activateScene(tunnelRef.current)
      })

      return sceneRenderer
    },
    [platinum, secret, startDate, user]
  )

  useEffect(() => {
    sceneRef.current?.setVisible(visible)
  }, [visible])

  const { containerRef } = useThreeJS(setup)
  return (
    <div
      className={cn(
        'absolute inset-0 flex justify-center items-center overflow-hidden w-full h-full',
        className
      )}
    >
      <div
        ref={containerRef}
        className="w-full h-full"
        onClick={(e) => {
          sceneRef.current?.click(e.nativeEvent)
        }}
      />
    </div>
  )
}

export default TicketCanvas
