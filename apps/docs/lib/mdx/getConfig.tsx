import specStorageV0 from '~/spec/storage_v0_config.yaml' assert { type: 'yml' }
import specRealtimeV0 from '~/spec/realtime_v0_config.yaml' assert { type: 'yml' }
import specAuthV1 from '~/spec/gotrue_v1_config.yaml' assert { type: 'yml' }
import specAnalyticsV0 from '~/spec/analytics_v0_config.yaml' assert { type: 'yml' }
import specFunctionsV0 from '~/spec/functions_v0_config.yaml' assert { type: 'yml' }

function getStorageConfigV0() {
  return { ...specStorageV0 }
}

function getRealtimeConfigV0() {
  return { ...specRealtimeV0 }
}

function getAuthConfigV1() {
  return { ...specAuthV1 }
}

function getAnalyticsConfigV0() {
  return { ...specAnalyticsV0 }
}

function getFunctionsConfigV0() {
  return { ...specFunctionsV0 }
}

export {
  getStorageConfigV0,
  getRealtimeConfigV0,
  getAuthConfigV1,
  getAnalyticsConfigV0,
  getFunctionsConfigV0,
}
