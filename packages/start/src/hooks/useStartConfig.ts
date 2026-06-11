'use client'

import { useCallback, useState } from 'react'

import { DEFAULT_CONFIG, type StartConfig } from '../lib/config'
import { normalizeStartConfig, type StartConfigState } from '../lib/start-config-state'
import type { Template } from '../lib/template-catalog'
import { useControlledStartConfig } from './useControlledStartConfig'

export function useStartConfig(
  templates: Template[],
  initialConfig: StartConfig = DEFAULT_CONFIG
): StartConfigState {
  const [cfg, setCfgState] = useState(() => normalizeStartConfig(initialConfig, templates))

  const onCfgChange = useCallback((next: StartConfig) => {
    setCfgState(next)
  }, [])

  return useControlledStartConfig(templates, cfg, onCfgChange)
}
