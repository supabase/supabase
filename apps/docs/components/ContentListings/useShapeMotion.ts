import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import { useState } from 'react'

interface ShapeMotion {
  shapeProps: { yaw: number; activation: number; fluidStep: number }
  activate: () => void
  deactivate: () => void
}

const FULL_TURN = Math.PI * 2
const TURN_DURATION_S = 2.4
const ACTIVATE_DURATION_S = 0.7

export const useShapeMotion = (): ShapeMotion => {
  const yaw = useMotionValue(0)
  const activation = useMotionValue(0)
  const [renderedYaw, setRenderedYaw] = useState(0)
  const [renderedActivation, setRenderedActivation] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  useMotionValueEvent(yaw, 'change', setRenderedYaw)
  useMotionValueEvent(activation, 'change', setRenderedActivation)

  const handleActivate = () => {
    animate(activation, 1, {
      duration: shouldReduceMotion ? 0 : ACTIVATE_DURATION_S,
      ease: 'easeOut',
    })
    if (shouldReduceMotion) return
    animate(yaw, yaw.get() + FULL_TURN, {
      duration: TURN_DURATION_S,
      ease: 'linear',
      repeat: Infinity,
    })
  }
  const handleDeactivate = () => {
    animate(activation, 0, {
      duration: shouldReduceMotion ? 0 : ACTIVATE_DURATION_S,
      ease: 'easeOut',
    })
    animate(yaw, Math.round(yaw.get() / FULL_TURN) * FULL_TURN, {
      duration: 0.6,
      ease: 'easeOut',
    })
  }

  return {
    shapeProps: {
      yaw: renderedYaw,
      activation: renderedActivation,
      // the glyphs move only while the shape turns. one glyph row each 200 ms, as on kb covers
      fluidStep: Math.floor(renderedYaw / (FULL_TURN / ((TURN_DURATION_S * 1000) / 200))),
    },
    activate: handleActivate,
    deactivate: handleDeactivate,
  }
}
