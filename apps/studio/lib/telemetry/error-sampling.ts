// dashboard_error_created is emitted from several sources (toast, form, admonition,
// error_display) that must share one capture rate — downstream analysis assumes a uniform
// sampling multiplier when comparing volumes across sources.
export const DASHBOARD_ERROR_SAMPLE_RATE = 0.1

export function isDashboardErrorSampled() {
  return Math.random() < DASHBOARD_ERROR_SAMPLE_RATE
}
