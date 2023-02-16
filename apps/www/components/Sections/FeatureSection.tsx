import { IconDatabase } from 'ui'

const FeatureSection = (props: any) => {
  return (
    <div className="grid grid-cols-12">
      <div className="col-span-3">
        <p className="mb-4">
          <IconDatabase />
        </p>
        <h4>Write less code</h4>
        <p>
          <p className="lg:text-lg">
            Use media in your project without needing to reply on external services or learn new
            frameworks.
          </p>
          <p>
            Familiar and easy to use permissions mean that your content is secure and accessible
            only to the right users
          </p>
        </p>
      </div>
      <div className="col-span-3 col-start-5">
        <p className="mb-4">
          <IconDatabase />
        </p>
        <h4>Blazing fast</h4>
        <p>
          <p className="lg:text-lg">
            Use media in your project without needing to reply on external services or learn new
            frameworks.
          </p>
          <p>
            Familiar and easy to use permissions mean that your content is secure and accessible
            only to the right users
          </p>
        </p>
      </div>
      <div className="col-span-3 col-start-9">
        <p className="mb-4">
          <IconDatabase />
        </p>
        <h4>Dependable</h4>
        <p>
          <p className="lg:text-lg">
            Use media in your project without needing to reply on external services or learn new
            frameworks.
          </p>
          <p>
            Familiar and easy to use permissions mean that your content is secure and accessible
            only to the right users
          </p>
        </p>
      </div>
    </div>
  )
}

export default FeatureSection
