export const HTTP_SIZE_METRICS_MAX_STATES = 4096

// The app exports one overflow series, and the OTel SDK reserves one more slot
// for its own overflow aggregation.
export const HTTP_SIZE_METRICS_AGGREGATION_CARDINALITY_LIMIT = HTTP_SIZE_METRICS_MAX_STATES + 2
