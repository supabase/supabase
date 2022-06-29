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
        className="dark:hover:bg-dark-700 -m-3 flex items-start rounded-lg p-3 transition duration-150 ease-in-out hover:bg-gray-50"
      >
        {/* <!-- Heroicon name: support --> */}
        <svg
          className="stroke-gray h-6 w-6 flex-shrink-0 dark:stroke-white "
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
          <p className="dark:text-dark-300 mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </a>
    )
    return (
      <a
        key={text}
        href={url}
        className="-m-3 flex flex-col justify-between rounded-lg p-3 transition duration-150 ease-in-out"
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
          <h3 className="dark:text-dark-300 text-sm font-medium uppercase tracking-wide text-gray-500">
            Latest blog posts
          </h3>
          <ul className="mt-6 space-y-6">
            {BlogPostsData.map((caseStudy: any, idx: number) => (
              <li className="flow-root" key={`flyout_case_${idx}`}>
                <a
                  href={caseStudy.url}
                  className="dark:hover:bg-dark-600 -m-3 flex rounded-lg py-3 transition duration-150 ease-in-out hover:bg-gray-100"
                >
                  <div className="min-w-0 flex-1 sm:ml-3">
                    <h4 className="truncate text-base font-medium text-gray-900 dark:text-white">
                      {caseStudy.title}
                    </h4>
                    <p className="dark:text-dark-300 mt-1 text-sm text-gray-500">
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
            className="dark:text-brand-900 dark:hover:text-brand-700 text-gray-600 transition duration-150 ease-in-out hover:text-gray-500"
          >
            View all posts <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </React.Fragment>
  )
}

export default Company
