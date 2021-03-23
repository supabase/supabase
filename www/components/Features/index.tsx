import { Button, Badge, Typography } from '@supabase/ui'
import SectionHeader from 'components/UI/SectionHeader'
import Solutions from 'data/Solutions.json'

const Features = () => {
  const IconSections = Object.values(Solutions).map((solution: any) => {
    const { name, description, icon, label, url } = solution
    return (
      <div key={name} className="mb-16">
        <div className="flex items-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gray-900 text-white dark:bg-white">
            <svg
              className="h-6 w-6 stroke-white dark:stroke-black"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
            </svg>
          </div>
          <dt className="flex flex-row xl:flex-col ml-4">
            <Typography.Title level={4}>{name}</Typography.Title>
          </dt>
        </div>
        <div className="mt-5">
          <Typography.Text>{description}</Typography.Text>
        </div>
        {label && (
          <div className="mt-3">
            <Badge dot>{label}</Badge>
          </div>
        )}
        {url && (
          <a href={url} className="block mt-3">
            <Typography.Link style={{ textDecoration: 'underline' }} className="mt-5">
              Learn more
            </Typography.Link>
          </a>
        )}
      </div>
    )
  })

  return (
    <div className="bg-gray-50 dark:bg-dark-800 overflow-hidden py-12">
      <div className="container mx-auto px-8 sm:px-16 xl:px-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={'Build Faster'}
            title_alt={' and Focus on Your Products'}
            subtitle={'What you get with Supabase'}
          />
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 md:gap-16">
            {IconSections}
          </dl>
        </div>
      </div>
    </div>
  )
}

export default Features
