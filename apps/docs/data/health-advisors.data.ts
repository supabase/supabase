/**
 * Health advisors read service logs rather than the schema, so they aren't documented in
 * splinter alongside the security and performance lints. `DatabaseAdvisorsIndex` prepends
 * these, matching the order of the advisors in Studio.
 */
export const healthAdvisors = [
  {
    path: 'log_data_api_error_rate_high',
    content: `**Summary:** Data API error rate is persistently high

**Ramification:** Data API requests are returning 5xx errors, so reads and writes from your app may fail.

***

### How to Resolve

Pull up to five recent 5xx responses on \`/rest/v1\` paths from \`edge_logs\` with their IDs, timestamps, and status. You can use [Logs](/dashboard/project/_/logs/edge-logs) in Studio, the MCP [\`query_logs\`](/docs/guides/observability/advanced-log-filtering#mcp) tool, or the [Management API](/docs/guides/observability/advanced-log-filtering#api). Then follow [API error troubleshooting](/docs/guides/troubleshooting/discovering-and-interpreting-api-errors-in-the-logs-7xREI9).`,
  },
  {
    path: 'log_auth_error_rate_high',
    content: `**Summary:** Auth error rate is persistently high

**Ramification:** Users may be unable to sign in or refresh their session.

***

### How to Resolve

Pull up to five recent errors from \`auth_logs\` with their IDs, timestamps, and status. You can use [Logs](/dashboard/project/_/logs/auth-logs) in Studio, the MCP [\`query_logs\`](/docs/guides/observability/advanced-log-filtering#mcp) tool, or the [Management API](/docs/guides/observability/advanced-log-filtering#api). Then use [Auth error codes](/docs/guides/auth/debugging/error-codes) to interpret them.`,
  },
  {
    path: 'log_storage_error_rate_high',
    content: `**Summary:** Storage error rate is persistently high

**Ramification:** File uploads and downloads may fail.

***

### How to Resolve

Pull up to five recent errors from \`storage_logs\` with their IDs, timestamps, and status. You can use [Logs](/dashboard/project/_/logs/storage-logs) in Studio, the MCP [\`query_logs\`](/docs/guides/observability/advanced-log-filtering#mcp) tool, or the [Management API](/docs/guides/observability/advanced-log-filtering#api). Then use [Storage error codes](/docs/guides/storage/debugging/error-codes) to interpret them.`,
  },
  {
    path: 'log_edge_function_error_rate_high',
    content: `**Summary:** Edge Function error rate is persistently high

**Ramification:** Features that call your Edge Functions may fail.

***

### How to Resolve

Pull up to five recent failed invocations from \`function_edge_logs\` with their IDs, timestamps, and status. You can use [Logs](/dashboard/project/_/logs/edge-functions-logs) in Studio, the MCP [\`query_logs\`](/docs/guides/observability/advanced-log-filtering#mcp) tool, or the [Management API](/docs/guides/observability/advanced-log-filtering#api). Then use [Edge Functions error codes](/docs/guides/functions/error-codes) to interpret them.`,
  },
]
