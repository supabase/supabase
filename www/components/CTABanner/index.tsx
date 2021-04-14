import { Button, Typography } from '@supabase/ui'

const CTABanner = (props: any) => {
  const { darkerBg } = props
  return (
    <div
      className={`
        py-32 grid grid-cols-12 gap-4 items-center text-center bg-dark-800 border-t dark:border-gray-600
        ${darkerBg ? 'dark:bg-dark-900' : ''} px-16
      `}
    >
      <div className="col-span-12">
        <Typography.Title level={2}>
          <span style={{ color: '#bbbbbb' }}>Build in a weekend,</span>
          <span style={{ color: '#ffffff' }}> scale to millions</span>
        </Typography.Title>
      </div>
      <div className="col-span-12 mt-4">
        <a href="https://app.supabase.io/api/login">
          <Button size="medium">Start your project</Button>
        </a>
      </div>
    </div>
  )
}

export default CTABanner
