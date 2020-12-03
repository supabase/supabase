import React from 'react'
import Badge from 'components/Badge'
import SolutionsData from 'data/Solutions.json'
import CaseStudiesData from 'data/CaseStudies.json'

const Product = () => {
  const iconSections = Object.values(SolutionsData).map((solution) => {
    const { name, description, icon, label, url } = solution

    const content = (
      <div className="flex md:h-full lg:flex-col">
        <div className="flex-shrink-0">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-gray-900 dark:bg-white text-white sm:h-12 sm:w-12">
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
        </div>
        <div className="ml-4 md:flex-1 md:flex md:flex-col md:justify-between lg:ml-0 lg:mt-4">
          <div>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {name} {label && <Badge className="ml-3">{label}</Badge>}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">{description}</p>
          </div>
          {url && (
            <p className="mt-2 text-sm font-medium text-brand-600 lg:mt-4">
              Learn more <span aria-hidden="true">&rarr;</span>
            </p>
          )}
        </div>
      </div>
    )
    return url ? (
      <a
        key={name}
        href="#"
        className="-m-3 p-3 flex flex-col justify-between rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition ease-in-out duration-150"
      >
        {content}
      </a>
    ) : (
      <div
        key={name}
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
          <h3 className="text-sm font-medium tracking-wide text-gray-500 dark:text-dark-300 uppercase">
            Latest case studies
          </h3>
          <ul className="mt-6 space-y-6">
            {CaseStudiesData.map((caseStudy: any, idx: number) => (
              <li className="flow-root" key={`flyout_case_${idx}`}>
                <a
                  href={caseStudy.url}
                  className="-m-3 p-3 flex rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition ease-in-out duration-150"
                >
                  <div className="hidden sm:block flex-shrink-0">
                    <img
                      className="w-32 h-20 object-cover rounded-md"
                      src={caseStudy.imgUrl}
                      alt="caseStudyThumb"
                    />
                  </div>
                  <div className="min-w-0 flex-1 sm:ml-8">
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
        {/* <div className="mt-6 text-sm font-medium">
          <a
            href="/blog"
            className="text-gray-600 hover:text-gray-500 dark:text-brand-600 dark:hover:text-brand-700 transition ease-in-out duration-150"
          >
            View all posts <span aria-hidden="true">&rarr;</span>
          </a>
        </div> */}
      </div>
    </React.Fragment>
  )
}

export default Product
