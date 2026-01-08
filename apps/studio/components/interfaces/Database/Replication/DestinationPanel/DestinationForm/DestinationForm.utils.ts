import z from 'zod'

import { DestinationType } from '../DestinationPanel.types'
import { CREATE_NEW_KEY, CREATE_NEW_NAMESPACE } from './DestinationForm.constants'
import { DestinationPanelFormSchema } from './DestinationForm.schema'

// Helper function to build destination config for validation
export const buildDestinationConfigForValidation = ({
  projectRef,
  selectedType,
  data,
}: {
  projectRef?: string
  selectedType: DestinationType
  data: z.infer<typeof DestinationPanelFormSchema>
}) => {
  if (!projectRef) throw new Error('Project ref is required')

  if (selectedType === 'BigQuery') {
    return {
      bigQuery: {
        projectId: data.projectId ?? '',
        datasetId: data.datasetId ?? '',
        serviceAccountKey: data.serviceAccountKey ?? '',
        ...(data.maxStalenessMins !== undefined ? { maxStalenessMins: data.maxStalenessMins } : {}),
      },
    }
  } else if (selectedType === 'Analytics Bucket') {
    // For validation, use the namespace as-is (even if it's CREATE_NEW_NAMESPACE)
    // The actual creation will happen later in submitPipeline
    const validationNamespace =
      data.namespace === CREATE_NEW_NAMESPACE ? data.newNamespaceName : data.namespace

    // For validation purposes, if CREATE_NEW_KEY is selected, we skip S3 key validation
    // The actual key creation will happen later in submitPipeline
    // We'll use placeholder values for validation
    const s3Keys =
      data.s3AccessKeyId === CREATE_NEW_KEY
        ? { accessKey: 'placeholder', secretKey: 'placeholder' }
        : { accessKey: data.s3AccessKeyId ?? '', secretKey: data.s3SecretAccessKey ?? '' }

    return {
      iceberg: {
        projectRef,
        warehouseName: data.warehouseName ?? '',
        namespace: validationNamespace,
        catalogToken: data.catalogToken ?? '',
        s3AccessKeyId: s3Keys.accessKey,
        s3SecretAccessKey: s3Keys.secretKey,
        s3Region: data.s3Region ?? '',
      },
    }
  } else {
    throw new Error('Invalid destination type')
  }
}
