import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from 'data/database/supavisor-configuration-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import { useMemo } from 'react'

export const usePoolerConfiguration = ({ projectRef }: { projectRef?: string }) => {
  const { data: org } = useSelectedOrganizationQuery()

  const {
    data: pgbouncerConfig,
    error: pgbouncerError,
    isLoading: isLoadingPgbouncerConfig,
    isError: isErrorPgbouncerConfig,
    isSuccess: isSuccessPgBouncerConfig,
  } = usePgbouncerConfigQuery({ projectRef })
  const {
    data: supavisorConfig,
    error: supavisorConfigError,
    isLoading: isLoadingSupavisorConfig,
    isError: isErrorSupavisorConfig,
    isSuccess: isSuccessSupavisorConfig,
  } = useSupavisorConfigurationQuery({ projectRef })

  const sharedPoolerPreferred = useMemo(() => {
    return org?.plan?.id === 'free'
  }, [org])

  const poolerError = sharedPoolerPreferred ? pgbouncerError : supavisorConfigError
  const isLoadingPoolerConfig = !IS_PLATFORM
    ? false
    : sharedPoolerPreferred
      ? isLoadingPgbouncerConfig
      : isLoadingSupavisorConfig
  const isErrorPoolerConfig = !IS_PLATFORM
    ? undefined
    : sharedPoolerPreferred
      ? isErrorPgbouncerConfig
      : isErrorSupavisorConfig
  const isSuccessPoolerConfig = !IS_PLATFORM
    ? true
    : sharedPoolerPreferred
      ? isSuccessPgBouncerConfig
      : isSuccessSupavisorConfig

  const sharedPoolerConfiguration = supavisorConfig?.find((x) => x.identifier === projectRef)
  const poolingConfiguration = sharedPoolerPreferred ? sharedPoolerConfiguration : pgbouncerConfig

  return {
    error: poolerError,
    isLoading: isLoadingPoolerConfig,
    isError: isErrorPoolerConfig,
    isSuccess: isSuccessPoolerConfig,
    sharedPoolerConfiguration,
    poolingConfiguration,
  }
}
