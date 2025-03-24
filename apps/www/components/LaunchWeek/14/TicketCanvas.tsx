import { cn } from 'ui'
import { useThreeJS } from './helpers'
import { useCallback, useEffect, useRef, useState } from 'react'
import SceneRenderer from './utils/SceneRenderer'
import TicketScene from './scenes/TicketScene'
import TunnelScene from './scenes/TunnelScene'
import useConfData from './hooks/use-conf-data'
import HUDScene from './scenes/HUDScene'

interface TicketCanvasProps {
  className?: string
  onUpgradeToSecret?: () => void
  narrow: boolean
}

const TicketCanvas = ({ className, onUpgradeToSecret, narrow }: TicketCanvasProps) => {
  const sceneRef = useRef<TicketScene | null>(null)
  const tunnelRef = useRef<TunnelScene | null>(null)
  const [hudObj, setHudObj] = useState<HUDScene | null>(null)
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

        const tunnel = new TunnelScene({
          defaultVisible: true,
        })

        const hud = new HUDScene({
          defaultVisible: true,
          defaultLayout: initialSceneDataRef.current.narrow
            ? 'narrow'
            : initialSceneDataRef.current.visible
              ? 'ticket'
              : 'default',
        })

        await sceneRenderer.activateScene(scene, true)
        await sceneRenderer.activateScene(tunnel)
        await sceneRenderer.activateScene(hud)

        sceneRef.current = scene
        tunnelRef.current = tunnel
        setHudObj(hud)

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
      if (!narrow) {
        if (state.ticketVisibility) {
          hudObj?.dimmHud()
          hudObj?.setLayout('ticket')
        } else {
          hudObj?.undimmHud()
          hudObj?.setLayout('default')
        }
      }
    }
  }, [
    hudObj,
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

  useEffect(() => {
    const isOn = state.partymodeStatus === 'on'
    const data = state.gaugesData
    if (data && hudObj) {
      if (isOn) {
        hudObj.setPeopleOnlineActive(true, true)

        if (data.peopleOnline) hudObj.setPeopleOnline(data.peopleOnline, true)
        if (data.payloadSaturation) hudObj.setMeetupsAmount(data.payloadSaturation, true)
        if (data.payloadFill) hudObj.setPayloadFill(data.payloadFill, true)
        if (data.meetupsAmount) hudObj.setMeetupsAmount(data.meetupsAmount, true)
      } else {
        hudObj.setPeopleOnlineActive(false, true)
        hudObj.setPeopleOnline(0, true)
        hudObj.setMeetupsAmount(0, true)
        hudObj.setPayloadFill(0, true)
        hudObj.setMeetupsAmount(0, true)
      }

      hudObj.draw()
    }
  }, [state.gaugesData, state.partymodeStatus, hudObj])

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
