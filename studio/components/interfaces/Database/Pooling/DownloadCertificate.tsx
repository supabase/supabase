import { FC } from 'react'
import { Button, Typography, IconDownload } from '@supabase/ui'

interface Props {
  createdAt: string
}

const DownloadCertificate: FC<Props> = ({ createdAt }) => {
  // instances before 3 : 08 pm sgt 29th April don't have certs installed
  if (new Date(createdAt) < new Date('2021-04-30')) return null
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod' ? 'prod' : 'staging'
  return (
    <div className="w-full flex items-center justify-between">
      <div>
        <Typography.Text className="block">SSL Connection</Typography.Text>
        <div>
          <Typography.Text type="secondary" className="opacity-50">
            Use this certificate to prevent snooping and man-in-the-middle attacks.
          </Typography.Text>
        </div>
      </div>
      <Button type="default" icon={<IconDownload />}>
        <a
          href={`https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/${env}/ssl/${env}-ca-2021.crt`}
        >
          Download Certificate
        </a>
      </Button>
    </div>
  )
}

export default DownloadCertificate
