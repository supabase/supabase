'use client'

import { useQueryStates } from 'nuqs'
import { useCallback, useMemo } from 'react'
import {
  parseStartConfigFromSearchParams,
  startConfigToSearchParams,
  useControlledStartConfig,
  type StartConfig,
  type StartConfigState,
  type Template,
} from 'start'

import { startNuqsSearchParams } from './start-search-params'

export function useStartConfigSearchParams(templates: Template[]): StartConfigState {
  const [params, setParams] = useQueryStates(startNuqsSearchParams)

  const cfg = useMemo(
    () => parseStartConfigFromSearchParams(params, templates),
    [params, templates]
  )

  const onCfgChange = useCallback(
    (next: StartConfig) => {
      void setParams(startConfigToSearchParams(next))
    },
    [setParams]
  )

  return useControlledStartConfig(templates, cfg, onCfgChange)
}
