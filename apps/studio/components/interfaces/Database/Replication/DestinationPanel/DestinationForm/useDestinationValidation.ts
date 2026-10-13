import type { DestinationType } from '../DestinationPanel.types'
import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { buildDestinationConfigForValidation } from './DestinationForm.utils'
import { useValidateDestinationMutation } from '@/data/replication/validate-destination-mutation'

export const useDestinationValidation = ({
  projectRef,
  selectedType,
}: {
  projectRef?: string
  selectedType: DestinationType
}) => {
  const { mutateAsync, isPending: isValidatingDestination } = useValidateDestinationMutation()

  const validateDestination = ({
    data,
    ...pipelineOptions
  }: {
    data: DestinationPanelSchemaType
  } & Omit<Parameters<typeof mutateAsync>[0], 'projectRef' | 'destinationConfig'>) => {
    if (!projectRef) throw new Error('Project ref is required')

    return mutateAsync({
      projectRef,
      destinationConfig: buildDestinationConfigForValidation({ projectRef, selectedType, data }),
      ...pipelineOptions,
    })
  }

  return { validateDestination, isValidatingDestination }
}
