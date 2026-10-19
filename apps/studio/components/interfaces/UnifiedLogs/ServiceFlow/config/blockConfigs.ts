import {
  CableIcon,
  CodeIcon,
  GlobeIcon,
  HardDriveIcon,
  LockIcon,
  MonitorDotIcon,
  PackageOpenIcon,
  ReceiptTextIcon,
  ServerIcon,
  ShieldCheckIcon,
  ZapIcon,
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
  postgresDetailsFields,
  postgresPrimaryFields,
  postgrestPrimaryFields,
  postgrestResponseFields,
  storageDetailsFields,
  storagePrimaryFields,
  techDetailsFields,
  userAdditionalFields,
  userPrimaryField,
} from './serviceFlowFields'

export const authBlockConfig: BlockConfig = {
  title: 'Authentication',
  icon: LockIcon,
  primaryFields: authPrimaryFields,
}

export const postgrestBlockConfig: BlockConfig = {
  title: 'Data API',
  icon: ServerIcon,
  primaryFields: postgrestPrimaryFields,
  sections: [
    {
      title: 'Response Details',
      icon: ReceiptTextIcon,
      fields: postgrestResponseFields,
    },
  ],
}

export const networkBlockConfig: BlockConfig = {
  title: 'Network',
  icon: GlobeIcon,
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
      icon: ShieldCheckIcon,
      fields: authorizationFields,
    },
    {
      title: 'Tech Details',
      icon: MonitorDotIcon,
      fields: techDetailsFields,
    },
  ],
}

export const edgeFunctionBlockConfig: BlockConfig = {
  title: 'Edge Function',
  icon: ZapIcon,
  primaryFields: edgeFunctionPrimaryFields,
  sections: [
    {
      title: 'Function Details',
      icon: CodeIcon,
      fields: edgeFunctionDetailsFields,
    },
  ],
}

export const storageBlockConfig: BlockConfig = {
  title: 'Storage',
  icon: HardDriveIcon,
  primaryFields: storagePrimaryFields,
  sections: [
    {
      title: 'Storage Details',
      icon: PackageOpenIcon,
      fields: storageDetailsFields,
    },
  ],
}

export const postgresBlockConfig: BlockConfig = {
  title: 'Postgres',
  primaryFields: postgresPrimaryFields,
  sections: [
    {
      title: 'Connection & Session Details',
      icon: CableIcon,
      fields: postgresDetailsFields,
    },
  ],
}
