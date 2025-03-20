import { cn } from 'ui'
import { useThreeJS } from './helpers'
import { useCallback, useEffect, useRef } from 'react'
import SceneRenderer from './utils/SceneRenderer'
import TicketScene from './scenes/TicketScene'
import TunnelScene from './scenes/TunnelScene'
import useConfData from './hooks/use-conf-data'
import HUDScene from './scenes/HUDScene'

interface TicketCanvasProps {
  className?: string
  onUpgradeToSecret?: () => void
}

const TicketCanvas = ({ className, onUpgradeToSecret }: TicketCanvasProps) => {
  const sceneRef = useRef<TicketScene | null>(null)
  const tunnelRef = useRef<TunnelScene | null>(null)
  const hudRef = useRef<HUDScene | null>(null)
  const initQueue = useRef<{ init: Promise<void>; renderer: SceneRenderer }[]>([])
  const onUpgradeToSecretRef = useRef(onUpgradeToSecret)
  const [state, dispatch] = useConfData()
  const userData = state.userTicketData
  const initialSceneDataRef = useRef({
    visible: state.ticketVisibility,
    secret: state.userTicketData.secret,
    platinum: state.userTicketData.platinum,
    user: {
      id: state.userTicketData.id,
      name: state.userTicketData.name,
      ticketNumber: state.userTicketData.ticket_number,
    },
  })

  const setup = useCallback(
    (container: HTMLElement) => {
      const uuid = Math.random().toString(36).substring(7)

      const sceneRenderer = new SceneRenderer(container, initQueue.current, uuid)

      const initPromise = sceneRenderer.init(async () => {
        dispatch({ type: 'TICKET_LOADING_START' })
        const scene = new TicketScene({
          defaultVisible: initialSceneDataRef.current.visible,
          defaultSecret: initialSceneDataRef.current.secret,
          defaultPlatinum: initialSceneDataRef.current.platinum,
          user: initialSceneDataRef.current.user,
          onSeatChartButtonClicked: () => {
            scene.showBackSide()
            scene.upgradeToSecret()
            onUpgradeToSecretRef.current?.()
          },
          onGoBackButtonClicked: () => {
            scene.showFrontSide()
          },
        })

        const tunnel = new TunnelScene({
          defaultVisible: true,
        })

        const hud = new HUDScene({
          defaultVisible: true,
        })

        await sceneRenderer.activateScene(scene, true)
        await sceneRenderer.activateScene(tunnel)
        await sceneRenderer.activateScene(hud)

        sceneRef.current = scene
        tunnelRef.current = tunnel
        hudRef.current = hud

        // Example: Update people online count based on ticket number
        // In a real app, you might fetch this from an API
        if (userData.ticket_number) {
          const baseCount = 1000
          const randomOffset = Math.floor(Math.random() * 500)
          hudRef.current.setPeopleOnline(baseCount + randomOffset)
        }

        hudRef.current.setOxygenLevel(0.6)
        hudRef.current.setShieldIntegrity(0.99)

        // Example: Set fuel level based on user data
        // This is just a placeholder - you'd use real data in production
        const fuelLevel = userData.platinum ? 0.95 : 0.75
        hudRef.current.setFuelLevel(fuelLevel)

        dispatch({ type: 'TICKET_LOADING_SUCCESS' })
      })

      initQueue.current.push({ init: initPromise, renderer: sceneRenderer })

      return sceneRenderer
    },
    [dispatch]
  )

  useEffect(() => {
    async function updateTicket() {
      if (sceneRef.current) {
        sceneRef.current.setVisible(state.ticketVisibility)
        sceneRef.current.setTicketNumber(state.userTicketData.ticket_number ?? 0)
        sceneRef.current.setUserName(state.userTicketData.name ?? '')

        if (state.userTicketData.secret) await sceneRef.current.upgradeToSecret()
        if (state.userTicketData.platinum) await sceneRef.current.upgradeToPlatinum()

        sceneRef.current.reloadTextures()
      }
    }

    if (sceneRef.current) {
      void updateTicket()
      if (state.ticketVisibility) {
        hudRef.current?.dimmHud()
        hudRef.current?.setLayout("ticket")
      } else {
        hudRef.current?.undimmHud()
        hudRef.current?.setLayout("default")
      }
    }
  }, [state.ticketVisibility, state.userTicketData.name, state.userTicketData.platinum, state.userTicketData.secret, state.userTicketData.ticket_number])

  useEffect(() => {
    if (!hudRef.current || !userData) return

    // Example: Update people online count based on ticket number
    // In a real app, you might fetch this from an API
    if (userData.ticket_number) {
      const baseCount = 1000
      const randomOffset = Math.floor(Math.random() * 500)
      hudRef.current.setPeopleOnline(baseCount + randomOffset)
    }

    // Example: Set fuel level based on user data
    // This is just a placeholder - you'd use real data in production
    const fuelLevel = userData.platinum ? 0.95 : 0.75
    hudRef.current.setFuelLevel(fuelLevel)
  }, [userData])

  useEffect(() => {
    onUpgradeToSecretRef.current = onUpgradeToSecret
  }, [onUpgradeToSecret])

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
