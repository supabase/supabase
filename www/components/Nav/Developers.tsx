import React from 'react'
import DevelopersData from 'data/Developers.json'
import AnnouncementsData from 'data/Announcements.json'
import { useRouter } from 'next/router'

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
      <div className="-m-3 p-3 flex items-start rounded-lg hover:bg-gray-50 dark:hover:bg-scale-500 transition ease-in-out duration-150">
        {/* <!-- Heroicon name: support --> */}
        <svg
          className="flex-shrink-0 h-5 w-5 stroke-scale-900"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={icon} />
        </svg>
        <div className="ml-4">
          <h5 className="text-base text-scale-1200">{text}</h5>
          <p className="text-sm text-scale-900">{description}</p>
        </div>
      </div>
    )
    return url ? (
      <a
        key={text}
        href={url}
        className="p-3 col-span-6 rounded hover:bg-gray-50 dark:hover:bg-scale-500 transition"
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
    <div className="grid grid-cols-12">
      <nav className="col-span-6 py-8" aria-labelledby="solutionsHeading">
        <div className="grid grid-cols-12 m-3 gap-x-8 gap-y-4 py-4 pr-3">{iconSections}</div>
      </nav>
      <div className="col-span-6">
        <div className="m-3 mx-6">
          <p className="p">Latest announcements</p>
          <ul className="mt-6 space-y-3 pb-6">
            {AnnouncementsData.map((caseStudy: any, idx: number) => (
              <li className="flow-root" key={`flyout_case_${idx}`}>
                <a
                  href={caseStudy.url}
                  className="p-3 flex rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition ease-in-out duration-150 border items-center"
                >
                  <div className="hidden sm:block flex-shrink-0">
                    <img
                      className="w-32 h-20 object-cover rounded-md"
                      src={`${basePath}/${caseStudy.imgUrl}`}
                      alt="caseStudyThumb"
                    />
                  </div>
                  <div className="min-w-0 flex-1 sm:ml-4">
                    <h4 className="text-base text-scale-1200 mb-0 text-normal">
                      {caseStudy.title}
                    </h4>
                    <p className="p text-sm">{caseStudy.description}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Developers
