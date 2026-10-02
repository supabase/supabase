import {
  httpPoolBusySockets,
  httpPoolErrors,
  httpPoolFreeSockets,
  httpPoolPendingRequests,
} from '@internal/monitoring/metrics'
import Agent, { HttpsAgent } from 'agentkeepalive'
import { getConfig } from '../../config'

const { region } = getConfig()

export interface InstrumentedAgent {
  httpAgent: Agent
  httpsAgent: HttpsAgent
  monitor: () => NodeJS.Timeout | undefined
  close: () => void
}

export interface AgentStats {
  busySocketCount: number
  freeSocketCount: number
  pendingRequestCount: number
  errorSocketCount: number
  timeoutSocketCount: number
  createSocketErrorCount: number
}

/**
 * Creates an instrumented agent
 * Adding metrics to the agent
 */
export function createAgent(name: string, options: { maxSockets: number }): InstrumentedAgent {
  const agentOptions = {
    maxSockets: options.maxSockets,
    keepAlive: true,
    keepAliveMsecs: 1000,
    freeSocketTimeout: 1000 * 15,
  }

  const httpAgent = new Agent(agentOptions)
  const httpsAgent = new HttpsAgent(agentOptions)
  let watcher: NodeJS.Timeout | undefined = undefined

  return {
    httpAgent,
    httpsAgent,
    monitor: () => {
      const agent = watchAgent(name, 'https', httpsAgent)
      watcher = agent
      return agent
    },
    close: () => {
      if (watcher) {
        clearInterval(watcher)
      }
    },
  }
}

/**
 * Updates HTTP agent metrics
 */
function updateHttpAgentMetrics(name: string, protocol: string, stats: AgentStats) {
  const baseAttrs = { name, protocol }

  httpPoolBusySockets.record(stats.busySocketCount, baseAttrs)
  httpPoolFreeSockets.record(stats.freeSocketCount, baseAttrs)
  httpPoolPendingRequests.record(stats.pendingRequestCount, { name, region })
  httpPoolErrors.record(stats.errorSocketCount, { ...baseAttrs, type: 'socket_error' })
  httpPoolErrors.record(stats.timeoutSocketCount, { ...baseAttrs, type: 'timeout_socket_error' })
  httpPoolErrors.record(stats.createSocketErrorCount, { ...baseAttrs, type: 'create_socket_error' })
}

export function watchAgent(name: string, protocol: 'http' | 'https', agent: Agent | HttpsAgent) {
  return setInterval(() => {
    const httpStatus = agent.getCurrentStatus()

    const httpStats = gatherHttpAgentStats(httpStatus)

    updateHttpAgentMetrics(name, protocol, httpStats)
  }, 5000)
}

// Function to update metrics based on the current status of the agent
export function gatherHttpAgentStats(status: Agent.AgentStatus) {
  // Calculate the number of busy sockets by iterating over the `sockets` object
  let busySocketCount = 0
  for (const host in status.sockets) {
    if (status.sockets.hasOwnProperty(host)) {
      busySocketCount += status.sockets[host]
    }
  }

  // Calculate the number of free sockets by iterating over the `freeSockets` object
  let freeSocketCount = 0
  for (const host in status.freeSockets) {
    if (status.freeSockets.hasOwnProperty(host)) {
      freeSocketCount += status.freeSockets[host]
    }
  }

  // Calculate the number of pending requests by iterating over the `requests` object
  let pendingRequestCount = 0
  for (const host in status.requests) {
    if (status.requests.hasOwnProperty(host)) {
      pendingRequestCount += status.requests[host]
    }
  }

  return {
    busySocketCount,
    freeSocketCount,
    pendingRequestCount,
    errorSocketCount: status.errorSocketCount,
    timeoutSocketCount: status.timeoutSocketCount,
    createSocketErrorCount: status.createSocketErrorCount,
  }
}
