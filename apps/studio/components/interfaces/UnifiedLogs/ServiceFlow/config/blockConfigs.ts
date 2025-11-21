import { BlockConfig } from '../components/shared/Block'
import {
  authPrimaryFields,
  postgrestPrimaryFields,
  postgrestResponseFields,
  networkPrimaryFields,
  apiKeyPrimaryField,
  apiKeyAdditionalFields,
  userPrimaryField,
  userAdditionalFields,
  locationPrimaryField,
  locationAdditionalFields,
  authorizationFields,
  techDetailsFields,
  edgeFunctionPrimaryFields,
  edgeFunctionDetailsFields,
  storagePrimaryFields,
  storageDetailsFields,
  postgresPrimaryFields,
  postgresDetailsFields,
} from './serviceFlowFields'

export const authBlockConfig: BlockConfig = {
  title: 'Authentication',
  primaryFields: authPrimaryFields,
}

export const postgrestBlockConfig: BlockConfig = {
  title: 'Data API',
  primaryFields: postgrestPrimaryFields,
  sections: [
    {
      title: 'Response Details',
      fields: postgrestResponseFields,
      collapsible: true,
    },
  ],
}

export const networkBlockConfig: BlockConfig = {
  title: 'Network',
  primaryFields: networkPrimaryFields,
  sections: [
    {
      type: 'fieldWithSeeMore',
      primaryField: apiKeyPrimaryField,
      additionalFields: apiKeyAdditionalFields,
      showValueAsBadge: true,
    },
    {
      type: 'fieldWithSeeMore',
      primaryField: userPrimaryField,
      additionalFields: userAdditionalFields,
    },
    {
      type: 'fieldWithSeeMore',
      primaryField: locationPrimaryField,
      additionalFields: locationAdditionalFields,
    },
    {
      title: 'Authorization',
      fields: authorizationFields,
      collapsible: true,
    },
    {
      title: 'Tech Details',
      fields: techDetailsFields,
      collapsible: true,
    },
  ],
}

export const edgeFunctionBlockConfig: BlockConfig = {
  title: 'Edge Function',
  primaryFields: edgeFunctionPrimaryFields,
  sections: [
    {
      title: 'Function Details',
      fields: edgeFunctionDetailsFields,
      collapsible: true,
    },
  ],
}

export const storageBlockConfig: BlockConfig = {
  title: 'Storage',
  primaryFields: storagePrimaryFields,
  sections: [
    {
      title: 'Storage Details',
      fields: storageDetailsFields,
      collapsible: true,
    },
  ],
}

export const postgresBlockConfig: BlockConfig = {
  title: 'Postgres',
  primaryFields: postgresPrimaryFields,
  sections: [
    {
      title: 'Connection & Session Details',
      fields: postgresDetailsFields,
      collapsible: true,
    },
  ],
}
