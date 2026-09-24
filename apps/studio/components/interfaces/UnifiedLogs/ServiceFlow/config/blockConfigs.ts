import {
  Cable,
  Code,
  Globe,
  HardDrive,
  Hash,
  Lock,
  MonitorDot,
  PackageOpen,
  ReceiptText,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react'

import { BlockConfig } from '../components/shared/Block'
import {
  apiKeyAdditionalFields,
  apiKeyPrimaryField,
  authorizationFields,
  authPrimaryFields,
  edgeFunctionDetailsFields,
  edgeFunctionPrimaryFields,
  locationAdditionalFields,
  locationPrimaryField,
  networkPrimaryFields,
  postgresSessionFields,
  postgresStatementFields,
  postgrestPrimaryFields,
  postgresTransactionFields,
  postgrestResponseFields,
  storageDetailsFields,
  storagePrimaryFields,
  techDetailsFields,
  userAdditionalFields,
  userPrimaryField,
} from './serviceFlowFields'

export const authBlockConfig: BlockConfig = {
  title: 'Authentication',
  icon: Lock,
  primaryFields: authPrimaryFields,
}

export const postgrestBlockConfig: BlockConfig = {
  title: 'Data API',
  icon: Server,
  primaryFields: postgrestPrimaryFields,
  sections: [
    {
      title: 'Response Details',
      icon: ReceiptText,
      fields: postgrestResponseFields,
    },
  ],
}

export const networkBlockConfig: BlockConfig = {
  title: 'Network',
  icon: Globe,
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
      icon: ShieldCheck,
      fields: authorizationFields,
    },
    {
      title: 'Tech Details',
      icon: MonitorDot,
      fields: techDetailsFields,
    },
  ],
}

export const edgeFunctionBlockConfig: BlockConfig = {
  title: 'Edge Function',
  icon: Zap,
  primaryFields: edgeFunctionPrimaryFields,
  sections: [
    {
      title: 'Function Details',
      icon: Code,
      fields: edgeFunctionDetailsFields,
    },
  ],
}

export const storageBlockConfig: BlockConfig = {
  title: 'Storage',
  icon: HardDrive,
  primaryFields: storagePrimaryFields,
  sections: [
    {
      title: 'Storage Details',
      icon: PackageOpen,
      fields: storageDetailsFields,
    },
  ],
}

export const postgresBlockConfig: BlockConfig = {
  title: 'Postgres',
  primaryFields: postgresStatementFields,
  sections: [
    {
      title: 'Session',
      icon: Cable,
      fields: postgresSessionFields,
    },
    {
      title: 'Transaction',
      icon: Hash,
      fields: postgresTransactionFields,
    },
  ],
}
