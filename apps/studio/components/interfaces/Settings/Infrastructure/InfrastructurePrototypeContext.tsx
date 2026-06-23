import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import {
  INFRASTRUCTURE_MOCK_CONFIG,
  type InfrastructureMockConfig,
  type InfrastructureMockConfigPatch,
  type TableGroup,
} from './Infrastructure.mock'

type InfrastructurePrototypeContextValue = {
  config: InfrastructureMockConfig
  savedConfig: InfrastructureMockConfig
  configRevision: number
  isDirty: boolean
  isSaving: boolean
  setRegions: (regions: string[]) => void
  setTableGroups: (tableGroups: TableGroup[]) => void
  updateConfig: (patch: InfrastructureMockConfigPatch) => void
  reset: () => void
  commit: () => Promise<void>
}

const InfrastructurePrototypeContext = createContext<InfrastructurePrototypeContextValue | null>(
  null
)

const cloneConfig = (config: InfrastructureMockConfig): InfrastructureMockConfig =>
  structuredClone(config)

const configsAreEqual = (a: InfrastructureMockConfig, b: InfrastructureMockConfig) =>
  JSON.stringify(a) === JSON.stringify(b)

export const InfrastructurePrototypeProvider = ({
  children,
  initialConfig = INFRASTRUCTURE_MOCK_CONFIG,
}: {
  children: ReactNode
  initialConfig?: InfrastructureMockConfig
}) => {
  const [savedConfig, setSavedConfig] = useState<InfrastructureMockConfig>(() =>
    cloneConfig(initialConfig)
  )
  const [config, setConfig] = useState<InfrastructureMockConfig>(() => cloneConfig(initialConfig))
  const [configRevision, setConfigRevision] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = useMemo(() => !configsAreEqual(config, savedConfig), [config, savedConfig])

  const bumpConfigRevision = useCallback(() => {
    setConfigRevision((revision) => revision + 1)
  }, [])

  const setRegions = useCallback((regions: string[]) => {
    setConfig((prev) => ({ ...prev, regions }))
  }, [])

  const setTableGroups = useCallback((tableGroups: TableGroup[]) => {
    setConfig((prev) => ({
      ...prev,
      scaling: { ...prev.scaling, tableGroups },
    }))
  }, [])

  const updateConfig = useCallback((patch: InfrastructureMockConfigPatch) => {
    setConfig((prev) => ({
      ...prev,
      ...patch,
      availability: patch.availability
        ? { ...prev.availability, ...patch.availability }
        : prev.availability,
      reads: patch.reads ? { ...prev.reads, ...patch.reads } : prev.reads,
      scaling: patch.scaling ? { ...prev.scaling, ...patch.scaling } : prev.scaling,
    }))
  }, [])

  const reset = useCallback(() => {
    setConfig(cloneConfig(savedConfig))
    bumpConfigRevision()
  }, [savedConfig, bumpConfigRevision])

  const commit = useCallback(async () => {
    if (!isDirty) return

    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      const nextSaved = cloneConfig(config)
      setSavedConfig(nextSaved)
      setConfig(nextSaved)
      bumpConfigRevision()
      toast.success('Project updated')
    } finally {
      setIsSaving(false)
    }
  }, [config, isDirty, bumpConfigRevision])

  const value = useMemo(
    () => ({
      config,
      savedConfig,
      configRevision,
      isDirty,
      isSaving,
      setRegions,
      setTableGroups,
      updateConfig,
      reset,
      commit,
    }),
    [
      config,
      savedConfig,
      configRevision,
      isDirty,
      isSaving,
      setRegions,
      setTableGroups,
      updateConfig,
      reset,
      commit,
    ]
  )

  return <InfrastructurePrototypeContext value={value}>{children}</InfrastructurePrototypeContext>
}

export const useInfrastructurePrototype = () => {
  const context = use(InfrastructurePrototypeContext)
  if (!context) {
    throw new Error(
      'useInfrastructurePrototype must be used within InfrastructurePrototypeProvider'
    )
  }
  return context
}
