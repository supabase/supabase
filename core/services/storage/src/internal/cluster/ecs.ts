import { ECSClient, ListTasksCommand } from '@aws-sdk/client-ecs'

type ECSTaskMetadata = {
  Cluster: string
  Family: string
}

export class ClusterDiscoveryECS {
  private client: ECSClient
  private taskMetadata?: Promise<ECSTaskMetadata>

  constructor() {
    this.client = new ECSClient()
  }

  async getClusterSize() {
    if (!process.env.ECS_CONTAINER_METADATA_URI) {
      throw new Error('ECS_CONTAINER_METADATA_URI is not set')
    }

    const metadata = await this.getCachedTaskMetadata(process.env.ECS_CONTAINER_METADATA_URI)

    return await this.listTasks(metadata)
  }

  private async getTaskMetadata(metadataUri: string): Promise<ECSTaskMetadata> {
    const metadataUrl = `${metadataUri}/task`
    const response = await fetch(metadataUrl)

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined)
      const statusText = response.statusText ? ` ${response.statusText}` : ''
      throw new Error(
        `Request failed with status code ${response.status}${statusText} fetching ECS task metadata from ${metadataUrl}`
      )
    }

    return (await response.json()) as ECSTaskMetadata
  }

  private getCachedTaskMetadata(metadataUri: string): Promise<ECSTaskMetadata> {
    this.taskMetadata ??= this.getTaskMetadata(metadataUri).catch((error) => {
      this.taskMetadata = undefined
      throw error
    })

    return this.taskMetadata
  }

  private async listTasks(metadata: ECSTaskMetadata) {
    let taskCount = 0
    let nextToken: string | undefined

    do {
      const command = new ListTasksCommand({
        family: metadata.Family,
        cluster: metadata.Cluster,
        desiredStatus: 'RUNNING',
        nextToken,
      })
      const response = await this.client.send(command)
      taskCount += response.taskArns?.length ?? 0
      nextToken = response.nextToken
    } while (nextToken)

    return taskCount
  }
}
