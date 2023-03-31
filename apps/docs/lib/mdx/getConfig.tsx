// @ts-expect-error
import specStorageV0 from '~/../../spec/storage_v0_config.yaml' assert { type: 'yml' }
// @ts-expect-error
import specRealtimeV0 from '~/../../spec/realtime_v0_config.yaml' assert { type: 'yml' }
// @ts-expect-error
import specAuthV1 from '~/../../spec/gotrue_v1_config.yaml' assert { type: 'yml' }

function getStorageConfigV0() {
  return { ...specStorageV0 }
}

function getRealtimeConfigV0() {
  return { ...specRealtimeV0 }
}

function getAuthConfigV1() {
  return { ...specAuthV1 }
}

export { getStorageConfigV0, getRealtimeConfigV0, getAuthConfigV1 }
