import { cn } from 'ui'
import { useThreeJS } from './helpers'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  const initialSceneDataRef = useRef({ visible, secret, platinum, user, startDate })
  const sceneRef = useRef<TicketScene | null>(null)
  const tunnelRef = useRef<TunnelScene | null>(null)
  const initQueue = useRef<{ init: Promise<void>; renderer: SceneRenderer }[]>([])
  const [ticketState, setState] = useState(initialSceneDataRef.current)

  const setup = useCallback((container: HTMLElement) => {
    const uuid = Math.random().toString(36).substring(7)

    const sceneRenderer = new SceneRenderer(container, initQueue.current, uuid)

    const initPromise = sceneRenderer.init(async () => {
      const scene = new TicketScene({
        defaultVisible: initialSceneDataRef.current.visible,
        defaultSecret: initialSceneDataRef.current.secret,
        defaultPlatinum: initialSceneDataRef.current.platinum,
        user: initialSceneDataRef.current.user,
        startDate: initialSceneDataRef.current.startDate,
        onSeatChartButtonClicked: () => {
          scene.showBackSide()
          scene.upgradeToSecret()
        },
        onGoBackButtonClicked: () => {
          scene.showFrontSide()
        },
      })

      const tunnel = new TunnelScene({
        defaultVisible: true,
      })
      await sceneRenderer.activateScene(scene, true)
      await sceneRenderer.activateScene(tunnel)
      sceneRef.current = scene
      tunnelRef.current = tunnel
    })

    initQueue.current.push({ init: initPromise, renderer: sceneRenderer })

    return sceneRenderer
  }, [])

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setVisible(visible)
      sceneRef.current.setTicketNumber(user.ticketNumber ?? 0)
      sceneRef.current.setUserName(user.name ?? '')
      sceneRef.current.reloadTextures()
    }
  }, [visible, sceneRef, user.name, user.ticketNumber])

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
