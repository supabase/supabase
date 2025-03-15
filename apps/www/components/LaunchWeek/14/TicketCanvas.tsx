import { cn } from 'ui'
import { useThreeJS } from './helpers'
import { useCallback, useEffect, useRef } from 'react'
import SceneRenderer, { BaseScene } from './utils/SceneRenderer'
import TicketScene from './scenes/TicketScene'

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
  const setup = useCallback(
    (container: HTMLElement) => {
      let scene: BaseScene | null = null

      const sceneRenderer = new SceneRenderer(container)

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

      sceneRenderer.activateScene(sceneRef.current)

      sceneRenderer.init()

      return sceneRenderer
    },
    [platinum, secret, startDate, user]
  )

  useEffect(() => {
    console.log("Setting ticket visible", visible)
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
