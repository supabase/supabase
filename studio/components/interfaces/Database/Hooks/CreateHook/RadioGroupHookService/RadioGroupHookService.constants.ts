export const hookServiceOptions: {
  id: string
  label: string
  badge: string
  badgeType: 'brand' | 'amber'
  description: string
  img_url: string
}[] = [
  {
    id: 'http_request',
    label: 'HTTP Request',
    badge: 'Alpha',
    badgeType: 'brand',
    description: 'Send an HTTP request to any URL.',
    img_url: 'http-request.png',
  },
  {
    id: 'supabase_function',
    label: 'Supabase Function',
    badge: 'Coming soon',
    badgeType: 'amber',
    description: 'Choose a Supabase Function to run.',
    img_url: 'supabase-severless-function.png',
  },
  {
    id: 'google_cloud_function',
    label: 'Google cloud run',
    badge: 'Coming soon',
    badgeType: 'amber',
    description: 'Choose a google cloud function to run',
    img_url: 'google-cloud-run.png',
  },
  {
    id: 'aws_lambda_function',
    label: 'AWS Lambda',
    badge: 'Coming soon',
    badgeType: 'amber',
    description: 'Choose an AWS Lambda function to run.',
    img_url: 'aws-lambda-severless-function.png',
  },
]
