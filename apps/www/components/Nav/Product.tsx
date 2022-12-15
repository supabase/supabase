import React from 'react'
import SolutionsData from 'data/Solutions.json'
import CaseStudiesData from 'data/CaseStudies.json'
import { useRouter } from 'next/router'
import ProductIcon from '../ProductIcon'
import { Badge } from 'ui'
import Image from 'next/image'
import Link from 'next/link'

const Product = () => {
  const { basePath } = useRouter()

  const iconSections = Object.values(SolutionsData).map((solution) => {
    const { name, description, icon, label, url } = solution

    const content = (
      <div className="flex lg:flex-col">
        <div className="flex flex-row items-center">
          <ProductIcon icon={icon} />
          <h5 className="text-scale-1200 overwrite ml-3 mb-0 text-base">{name}</h5>
        </div>
        <div className="ml-4 mt-3 md:flex md:flex-1 md:flex-col md:justify-between lg:ml-0">
          <p className="text-scale-1000 text-sm">{description}</p>
          {label && (
            <div className="mt-2">
              <Badge>{label}</Badge>
            </div>
          )}
        </div>
      </div>
    )
    return (
      url && (
        <Link href={url} key={name}>
          <a className="hover:bg-scale-300 dark:hover:bg-scale-500 col-span-6 rounded p-3 transition">
            {content}
          </a>
        </Link>
      )
    )
  })

  return (
    <div className="grid grid-cols-12">
      <nav className="col-span-6" aria-labelledby="product">
        <div className="m-3 grid grid-cols-12 gap-x-8 gap-y-4 py-4 pr-3">{iconSections}</div>
      </nav>
      <div className="col-span-6">
        <div className="m-3 mx-6">
          <p className="p">Latest case studies</p>
          <ul className="mt-6 space-y-3">
            {CaseStudiesData.map((caseStudy: any, idx: number) => {
              if (idx > 1) {
                return null
              }
              return (
                <li className="flow-root" key={`flyout_case_${idx}`}>
                  <Link href={caseStudy.url}>
                    <a className="dark:hover:bg-dark-700 flex items-center rounded-lg border p-3 transition duration-150 ease-in-out hover:bg-gray-100">
                      <div className="relative hidden h-20 w-32 flex-shrink-0 overflow-auto rounded-md sm:block">
                        <Image
                          src={`${basePath}/${caseStudy.imgUrl}`}
                          alt="caseStudyThumb"
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 sm:ml-4">
                        <h4 className="text-scale-1200 text-normal mb-0 text-base">
                          {caseStudy.title}
                        </h4>
                        <p className="p text-sm">{caseStudy.description}</p>
                      </div>
                    </a>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Product
