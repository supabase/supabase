import {
  getPipelineCreateStepHeader,
  type PipelineCreateStepId,
  type PipelineDestinationType,
} from './CreatePipelineWizard.utils'

export const PipelineCreateStepDescription = ({
  step,
  destinationType,
}: {
  step: PipelineCreateStepId
  destinationType?: PipelineDestinationType
}) => {
  return getPipelineCreateStepHeader(step, { destinationType }).description
}
