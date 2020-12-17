import React from 'react'
import CompanyData from 'data/Company.json'
import BlogPostsData from 'data/BlogPosts.json'

type Props = {
  text: string
  description?: string
  url?: string
  icon?: string
}

const Company = () => {
  const iconSections = Object.values(CompanyData).map((company: Props) => {
    const { text, description, url, icon } = company

    const content = (
      <a
        href="#"
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
          <p className="text-base font-medium text-gray-900 dark:text-white">{text}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">{description}</p>
        </div>
      </a>
    )
    return (
      <a
        key={text}
        href={url}
        className="-m-3 p-3 flex flex-col justify-between rounded-lg transition ease-in-out duration-150"
      >
        {content}
      </a>
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
          <h3 className="text-sm font-medium tracking-wide text-gray-500 dark:text-dark-300 uppercase">
            Latest blog posts
          </h3>
          <ul className="mt-6 space-y-6">
            {BlogPostsData.map((caseStudy: any, idx: number) => (
              <li className="flow-root" key={`flyout_case_${idx}`}>
                <a
                  href={caseStudy.url}
                  className="-m-3 py-3 flex rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition ease-in-out duration-150"
                >
                  <div className="min-w-0 flex-1 sm:ml-3">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white truncate">
                      {caseStudy.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
                      {caseStudy.description}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 text-sm font-medium">
          <a
            href="/blog"
            className="text-gray-600 hover:text-gray-500 dark:text-brand-600 dark:hover:text-brand-700 transition ease-in-out duration-150"
          >
            View all posts <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </React.Fragment>
  )
}

export default Company
