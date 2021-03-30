import React from 'react'
import DevelopersData from 'data/Developers.json'
import AnnouncementsData from 'data/Announcements.json'
import { useRouter } from 'next/router'
import { Typography } from '@supabase/ui'

type Props = {
  text: string
  description?: string
  url?: string
  icon?: string
}

const Developers = () => {
  const { basePath } = useRouter()
  const iconSections = Object.values(DevelopersData).map((company: Props) => {
    const { text, description, url, icon } = company

    const content = (
      <a
        href={url}
        className="-m-3 p-3 flex items-start rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition ease-in-out duration-150"
      >
        {/* <!-- Heroicon name: support --> */}
        <svg
          className="flex-shrink-0 h-6 w-6 stroke-gray dark:stroke-white "
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icon} />
        </svg>
        <div className="ml-4">
          <Typography.Title level={5}>{text}</Typography.Title>
          <Typography.Text>{description}</Typography.Text>
        </div>
      </a>
    )
    return url ? (
      <a
        key={text}
        href={url}
        className="-m-3 p-3 flex flex-col justify-between rounded-lg transition ease-in-out duration-150"
      >
        {content}
      </a>
    ) : (
      <div
        key={text}
        className="-m-3 p-3 flex flex-col justify-between rounded-lg transition ease-in-out duration-150"
      >
        {content}
      </div>
    )
  })

  return (
    <React.Fragment>
      <nav
        className="grid gap-y-10 px-4 py-8 sm:grid-cols-2 sm:gap-x-8 sm:py-12 sm:px-6 lg:px-8 xl:pr-12"
        aria-labelledby="solutionsHeading"
      >
        {iconSections}
      </nav>
      <div className="px-4 py-8 sm:py-12 sm:px-6 lg:px-8 xl:pl-12">
        <div>
          <Typography.Text type="secondary">Latest announcements</Typography.Text>
          <ul className="mt-6 space-y-16">
            {AnnouncementsData.map((caseStudy: any, idx: number) => (
              <li className="flow-root" key={`flyout_case_${idx}`}>
                <a
                  href={caseStudy.url}
                  className="-m-3 p-3 flex rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition ease-in-out duration-150"
                >
                  <div className="hidden sm:block flex-shrink-0">
                    <img
                      className="w-32 h-20 object-cover rounded-md"
                      src={`${basePath}/${caseStudy.imgUrl}`}
                      alt="caseStudyThumb"
                    />
                  </div>
                  <div className="min-w-0 flex-1 sm:ml-8">
                    <Typography.Title level={5}>{caseStudy.title}</Typography.Title>
                    <Typography.Text type="secondary">{caseStudy.description}</Typography.Text>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </React.Fragment>
  )
}

export default Developers
