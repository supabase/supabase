import { EventEmitter } from 'node:events'
import { logger } from '@internal/monitoring'

const clusterEvent = new EventEmitter()

interface ClusterEvents {
  change: { size: number }
}

interface ClusterDiscovery {
  getClusterSize(): Promise<number>
}

export class Cluster {
  static size: number = 0
  protected static watcher?: NodeJS.Timeout = undefined

  static on<E extends keyof ClusterEvents>(
    event: E,
    listener: (payload: ClusterEvents[E]) => void
  ) {
    clusterEvent.on(event, listener)
  }

  static async init(abortSignal: AbortSignal) {
    if (abortSignal.aborted) {
      return
    }

    let cluster: ClusterDiscovery | null = null

    if (process.env.CLUSTER_DISCOVERY === 'ECS') {
      const { ClusterDiscoveryECS } = await import('./ecs')

      if (abortSignal.aborted) {
        return
      }

      cluster = new ClusterDiscoveryECS()
    } else if (process.env.CLUSTER_DISCOVERY === 'EKS') {
      const { ClusterDiscoveryEKS } = await import('./eks')

      if (abortSignal.aborted) {
        return
      }

      cluster = new ClusterDiscoveryEKS()
    }

    if (cluster) {
      const clusterSize = await cluster.getClusterSize()

      if (abortSignal.aborted) {
        return
      }

      Cluster.size = clusterSize

      logger.info(
        {
          type: 'cluster',
          clusterSize: Cluster.size,
          discoveryType: process.env.CLUSTER_DISCOVERY,
        },
        `[Cluster] Initial cluster size ${Cluster.size}`
      )

      if (abortSignal.aborted) {
        return
      }

      Cluster.watcher = setInterval(() => {
        cluster!
          .getClusterSize()
          .then((size) => {
            if (size && size !== Cluster.size) {
              clusterEvent.emit('change', { size })
              Cluster.size = size
            }
          })
          .catch((e) => {
            console.error('Error getting cluster size', e)
          })
      }, 20 * 1000)

      abortSignal.addEventListener(
        'abort',
        () => {
          if (Cluster.watcher) {
            clearInterval(Cluster.watcher)
            clusterEvent.removeAllListeners()
            Cluster.watcher = undefined
          }
        },
        { once: true }
      )
    }
  }
}
