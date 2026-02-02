import { useStopPipelineMutation } from './stop-pipeline-mutation'
import { useStartPipelineMutation } from './start-pipeline-mutation'

export interface RestartPipelineParams {
  projectRef: string
  pipelineId: number
}

/**
 * Helper hook that provides a restart function which properly stops and then starts a pipeline.
 *
 * ## Why Stop + Start?
 *
 * This explicit two-step restart process is necessary to work around edge cases where Kubernetes
 * doesn't properly recreate pods when using the start endpoint alone on a running pipeline. This happens
 * because crash looping pods are not restarted if the resource is patched. We will try to find a better
 * solution for this in the future.
 */
export const useRestartPipelineHelper = () => {
  const { mutateAsync: stopPipeline } = useStopPipelineMutation()
  const { mutateAsync: startPipeline } = useStartPipelineMutation()

  const restartPipeline = async ({ projectRef, pipelineId }: RestartPipelineParams) => {
    // Step 1: Stop the pipeline to ensure pods are fully terminated
    try {
      await stopPipeline({ projectRef, pipelineId })
    } catch (error: any) {
      throw new Error(`Failed to stop pipeline: ${error.message}`)
    }

    // Step 2: Start the pipeline to create fresh pods with clean state
    try {
      await startPipeline({ projectRef, pipelineId })
    } catch (error: any) {
      throw new Error(`Failed to start pipeline: ${error.message}`)
    }
  }

  return { restartPipeline }
}
