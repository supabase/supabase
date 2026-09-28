'use client'

import { useEffect, type EffectCallback } from 'react'

export const useMountEffect = (effect: EffectCallback) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, [])
}
