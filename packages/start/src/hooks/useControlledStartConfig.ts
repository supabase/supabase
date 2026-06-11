'use client'

import { useCallback, useMemo } from 'react'

import { buildStartComposition } from '../lib/composition/start-composition'
import type { StartConfig } from '../lib/config'
import {
  createStartConfigState,
  normalizeStartConfig,
  type StartConfigState,
} from '../lib/start-config-state'
import type { Template } from '../lib/template-catalog'

/** Wire external config storage (URL, server props, etc.) into the start configurator. */
export function useControlledStartConfig(
  templates: Template[],
  cfg: StartConfig,
  onCfgChange: (next: StartConfig) => void
): StartConfigState {
  const normalizedCfg = useMemo(() => normalizeStartConfig(cfg, templates), [cfg, templates])
  const composition = useMemo(
    () => buildStartComposition(normalizedCfg, templates),
    [normalizedCfg, templates]
  )

  const setCfg = useCallback(
    (updater: (current: StartConfig) => StartConfig) => {
      onCfgChange(normalizeStartConfig(updater(normalizedCfg), templates))
    },
    [normalizedCfg, onCfgChange, templates]
  )

  return useMemo(
    () => createStartConfigState(normalizedCfg, setCfg, templates, composition),
    [composition, normalizedCfg, setCfg, templates]
  )
}
