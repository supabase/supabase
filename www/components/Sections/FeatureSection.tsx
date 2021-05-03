import { IconDatabase, Typography } from '@supabase/ui'

const FeatureSection = (props: any) => {
  return (
    <div className="grid grid-cols-12">
      <div className="col-span-3">
        <p className="mb-4">
          <IconDatabase />
        </p>
        <Typography.Title level={4}>Write less code</Typography.Title>
        <Typography.Text>
          <p className="lg:text-lg">
            Use media in your project without needing to reply on external services or learn new
            frameworks.
          </p>
          <p>
            Familiar and easy to use permissions mean that your content is secure and accessible
            only to the right users
          </p>
        </Typography.Text>
      </div>
      <div className="col-span-3 col-start-5">
        <p className="mb-4">
          <IconDatabase />
        </p>
        <Typography.Title level={4}>Blazing fast</Typography.Title>
        <Typography.Text>
          <p className="lg:text-lg">
            Use media in your project without needing to reply on external services or learn new
            frameworks.
          </p>
          <p>
            Familiar and easy to use permissions mean that your content is secure and accessible
            only to the right users
          </p>
        </Typography.Text>
      </div>
      <div className="col-span-3 col-start-9">
        <p className="mb-4">
          <IconDatabase />
        </p>
        <Typography.Title level={4}>Dependable</Typography.Title>
        <Typography.Text>
          <p className="lg:text-lg">
            Use media in your project without needing to reply on external services or learn new
            frameworks.
          </p>
          <p>
            Familiar and easy to use permissions mean that your content is secure and accessible
            only to the right users
          </p>
        </Typography.Text>
      </div>
    </div>
  )
}

export default FeatureSection
