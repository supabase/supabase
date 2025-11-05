// [Joshen] These should eventually be in shared-types so that it can be used between infra and dashboard
// https://github.com/supabase/infrastructure/blob/a466d85ece3179cf7b6da1b15c11f2ed2be49bd6/shared/src/volumes.ts#L5-L24
// https://docs.aws.amazon.com/ebs/latest/userguide/provisioned-iops.html#io2-bx-considerations
export const IO2_AVAILABLE_REGIONS = [
  'ap-east-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ca-central-1',
  'eu-central-1',
  // 'eu-central-2',
  'eu-north-1',
  'eu-west-1',
  'eu-west-2',
  // 'eu-west-3',
  // 'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
]
