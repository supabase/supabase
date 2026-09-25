/**
 * Prototype-only. Fake associations for presenter scenarios.
 */

import {
  AWS_DIRECT_PREVIEW_ACCOUNT_ID,
  VERCEL_PREVIEW_AWS_ACCOUNT_ID,
  type PrivateLinkPreviewScenario,
} from './privateLinkPreview.constants'
import type { AWSAccount } from '@/data/aws-accounts/aws-accounts-query'

export type PreviewAWSAccount = AWSAccount & {
  partner?: 'vercel'
  destination_iam_role_arn?: string
}

const VERCEL_IAM_ROLE_ARN = `arn:aws:iam::${VERCEL_PREVIEW_AWS_ACCOUNT_ID}:role/TenantConnector`

function account(
  overrides: Partial<PreviewAWSAccount> & Pick<PreviewAWSAccount, 'status' | 'database_identifier'>
): PreviewAWSAccount {
  return {
    aws_account_id: AWS_DIRECT_PREVIEW_ACCOUNT_ID,
    account_name: 'Production VPC',
    database_type: 'PRIMARY',
    resource_access_manager_resource_config_id: 'rcfg-0123456789abcdef0',
    resource_access_manager_resource_config_arn:
      'arn:aws:vpc-lattice:us-east-1:000000000000:resourceconfiguration/rcfg-0123456789abcdef0',
    resource_access_manager_share_arn:
      'arn:aws:ram:us-east-1:000000000000:resource-share/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    shared_at: '2026-08-13T00:00:00.000Z',
    ...overrides,
  }
}

export function getPreviewAccounts(
  scenario: PrivateLinkPreviewScenario,
  projectRef?: string
): PreviewAWSAccount[] {
  const primaryId = projectRef ?? 'preview-primary'

  const awsConnected = account({
    status: 'ASSOCIATION_ACCEPTED',
    database_identifier: primaryId,
  })
  const awsWaiting = account({
    status: 'READY',
    account_name: undefined,
    database_identifier: primaryId,
  })
  const awsExpired = account({
    status: 'ASSOCIATION_REQUEST_EXPIRED',
    account_name: 'Staging VPC',
    aws_account_id: '210987654321',
    database_identifier: primaryId,
  })
  const vercelConnected = account({
    status: 'ASSOCIATION_ACCEPTED',
    account_name: undefined,
    aws_account_id: VERCEL_PREVIEW_AWS_ACCOUNT_ID,
    partner: 'vercel',
    destination_iam_role_arn: VERCEL_IAM_ROLE_ARN,
    database_identifier: primaryId,
  })

  switch (scenario) {
    case 'aws-direct-connected':
      return [awsConnected]
    case 'aws-direct-waiting':
      return [awsWaiting]
    case 'aws-direct-expired':
      return [awsExpired]
    case 'vercel-initiated':
    case 'marketplace-plus-privatelink':
    case 'private-hostname':
      return [vercelConnected]
    case 'empty':
    case 'marketplace':
    case 'vercel-fallback':
      return []
    case 'mixed-rows':
      return [vercelConnected, awsConnected]
    default:
      return []
  }
}
