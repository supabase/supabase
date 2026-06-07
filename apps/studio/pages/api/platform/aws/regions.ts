import { NextApiRequest, NextApiResponse } from 'next'

// [console fork] AWS commercial regions, served via API so the org AWS-credentials
// form can offer an always-current autocomplete without bundling a static list in
// the component. If an org already has working credentials we could later swap this
// for a live ec2:DescribeRegions call; this list covers all current commercial regions.
const AWS_REGIONS: Array<{ code: string; name: string }> = [
  { code: 'us-east-1', name: 'US East (N. Virginia)' },
  { code: 'us-east-2', name: 'US East (Ohio)' },
  { code: 'us-west-1', name: 'US West (N. California)' },
  { code: 'us-west-2', name: 'US West (Oregon)' },
  { code: 'af-south-1', name: 'Africa (Cape Town)' },
  { code: 'ap-east-1', name: 'Asia Pacific (Hong Kong)' },
  { code: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
  { code: 'ap-south-2', name: 'Asia Pacific (Hyderabad)' },
  { code: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
  { code: 'ap-northeast-2', name: 'Asia Pacific (Seoul)' },
  { code: 'ap-northeast-3', name: 'Asia Pacific (Osaka)' },
  { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
  { code: 'ap-southeast-2', name: 'Asia Pacific (Sydney)' },
  { code: 'ap-southeast-3', name: 'Asia Pacific (Jakarta)' },
  { code: 'ap-southeast-4', name: 'Asia Pacific (Melbourne)' },
  { code: 'ca-central-1', name: 'Canada (Central)' },
  { code: 'ca-west-1', name: 'Canada West (Calgary)' },
  { code: 'eu-central-1', name: 'Europe (Frankfurt)' },
  { code: 'eu-central-2', name: 'Europe (Zurich)' },
  { code: 'eu-west-1', name: 'Europe (Ireland)' },
  { code: 'eu-west-2', name: 'Europe (London)' },
  { code: 'eu-west-3', name: 'Europe (Paris)' },
  { code: 'eu-north-1', name: 'Europe (Stockholm)' },
  { code: 'eu-south-1', name: 'Europe (Milan)' },
  { code: 'eu-south-2', name: 'Europe (Spain)' },
  { code: 'il-central-1', name: 'Israel (Tel Aviv)' },
  { code: 'me-south-1', name: 'Middle East (Bahrain)' },
  { code: 'me-central-1', name: 'Middle East (UAE)' },
  { code: 'sa-east-1', name: 'South America (São Paulo)' },
]

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, max-age=86400')
  return res.status(200).json({ regions: AWS_REGIONS })
}
