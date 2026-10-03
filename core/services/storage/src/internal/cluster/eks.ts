import * as k8s from '@kubernetes/client-node'

/**
 * ClusterDiscoveryEKS provides cluster size discovery for Kubernetes/EKS environments.
 *
 * Environment Variables:
 * - KUBERNETES_NAMESPACE: The namespace to monitor
 * - KUBERNETES_LABEL_SELECTOR: Label selector for storage pods
 * - KUBERNETES_SERVICE_HOST: The host of the Kubernetes service. This is present when running inside a pod and does not need to be set externally.
 */
export class ClusterDiscoveryEKS {
  private client: k8s.CoreV1Api
  private namespace: string
  private labelSelector: string

  constructor() {
    const kc = new k8s.KubeConfig()

    // Always load config from cluster when running inside a pod
    if (process.env.KUBERNETES_SERVICE_HOST) {
      kc.loadFromCluster()
    } else {
      throw new Error(
        'EKS cluster discovery is not supported when running outside of a Kubernetes cluster'
      )
    }

    if (!process.env.KUBERNETES_LABEL_SELECTOR) {
      throw new Error('KUBERNETES_LABEL_SELECTOR is not set')
    }

    this.client = kc.makeApiClient(k8s.CoreV1Api)

    // Get namespace from environment or default to current namespace
    this.namespace = process.env.KUBERNETES_NAMESPACE || 'storage'

    // Label selector to identify storage pods
    this.labelSelector = process.env.KUBERNETES_LABEL_SELECTOR
  }

  async getClusterSize(): Promise<number> {
    try {
      return await this.listPods()
    } catch (error) {
      throw new Error(`Failed to get cluster size: ${error}`)
    }
  }

  private async listPods(): Promise<number> {
    try {
      const response = await this.client.listNamespacedPod({
        namespace: this.namespace,
        labelSelector: this.labelSelector,
      })

      const pods = response.items || []
      const filteredPods = pods.filter((pod: k8s.V1Pod) => {
        const podPhase = pod.status?.phase
        return podPhase === 'Pending' || podPhase === 'Running'
      })

      return filteredPods.length
    } catch (error) {
      throw new Error(`Failed to list pods: ${error}`)
    }
  }
}
