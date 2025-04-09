import { cn } from 'ui'
import { useThreeJS } from './helpers'
import { useCallback, useEffect, useRef } from 'react'
import SceneRenderer from './utils/SceneRenderer'
import TicketScene from './scenes/TicketScene'
import useConfData from './hooks/use-conf-data'

interface TicketCanvasProps {
  className?: string
  onUpgradeToSecret?: () => void
  narrow: boolean
}

const TicketCanvas = ({ className, onUpgradeToSecret, narrow }: TicketCanvasProps) => {
  const sceneRef = useRef<TicketScene | null>(null)
  const initQueue = useRef<{ init: Promise<void>; renderer: SceneRenderer }[]>([])
  const onUpgradeToSecretRef = useRef(onUpgradeToSecret)
  const [state, dispatch] = useConfData()
  const userData = state.userTicketData
  const initialSceneDataRef = useRef({
    visible: state.ticketVisibility,
    secret: state.userTicketData.secret,
    platinum: state.userTicketData.platinum,
    narrow: narrow,
    user: {
      id: state.userTicketData.id,
      name: state.userTicketData.name ?? state.userTicketData.username,
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
          narrow: initialSceneDataRef.current.narrow,
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

        await sceneRenderer.activateScene(scene, true)

        sceneRef.current = scene

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
        sceneRef.current.setUserName(
          state.userTicketData.name ?? state.userTicketData.username ?? ''
        )

        if (state.userTicketData.secret) await sceneRef.current.upgradeToSecret()
        if (state.userTicketData.platinum) await sceneRef.current.upgradeToPlatinum()

        sceneRef.current.reloadTextures()
      }
    }

    if (sceneRef.current) {
      void updateTicket()
    }
  }, [
    narrow,
    state.ticketVisibility,
    state.userTicketData.name,
    state.userTicketData.platinum,
    state.userTicketData.secret,
    state.userTicketData.ticket_number,
    state.userTicketData.username,
  ])

  useEffect(() => {
    onUpgradeToSecretRef.current = onUpgradeToSecret
  }, [onUpgradeToSecret])

  const { containerRef } = useThreeJS(setup)
  return (
    <div
      className={cn(
        'absolute sm:inset-0 flex justify-center items-center overflow-hidden w-full h-full z-0',
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
