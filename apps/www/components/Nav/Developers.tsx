import React from 'react'
import { data as DevelopersData } from 'data/Developers'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import { TextLink } from 'ui'
import { ListItem } from '.'

type Props = {
  text: string
  description?: string
  url?: string
  icon?: string
  svg?: any
}

<<<<<<< HEAD
const Developers = () => {
  const { basePath } = useRouter()

  const iconSections = links.map((link: Props) => {
    const { text, description, url, icon, svg: Svg } = link

    const content = (
      <div className="dark:hover:bg-scale-500 -m-3 flex items-start rounded-lg p-3 transition duration-150 ease-in-out hover:bg-gray-50">
        {/* <!-- Heroicon name: support --> */}
        {icon && (
          <svg
            className="stroke-scale-900 h-5 w-5 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
          </svg>
        )}
        {Svg && <Svg />}
        <div className="ml-4">
          <h5 className="text-scale-1200 text-base">{text}</h5>
          <p className="text-scale-900 text-sm">{description}</p>
        </div>
      </div>
    )
    return url ? (
      <Link href={url} key={text}>
        <a className="dark:hover:bg-scale-500 col-span-6 rounded p-3 transition hover:bg-gray-50">
          {content}
        </a>
      </Link>
    ) : (
      <div
        key={text}
        className="-m-3 flex flex-col justify-between rounded-lg p-3 transition duration-150 ease-in-out"
      >
        {content}
      </div>
    )
  })

  return (
    <div className="grid grid-cols-12">
      <nav className="col-span-6 py-6" aria-labelledby="developersResources">
        <div className="m-3 grid grid-cols-12 gap-2 pr-3">{iconSections}</div>
      </nav>
      <div className="col-span-6 py-8">
        <div className="py-3 mx-6">
          <p className="p">Latest announcements</p>
          <ul className="mt-6 space-y-3">
            {AnnouncementsData.map((announcement: any, idx: number) => (
              <li className="flow-root" key={`flyout_case_${idx}`}>
                <Link href={announcement.url}>
                  <a className="dark:hover:bg-dark-700 flex items-center rounded-lg border p-3 transition duration-150 ease-in-out hover:bg-gray-100">
                    <div className="relative hidden h-20 w-32 flex-shrink-0 overflow-auto rounded-md sm:block">
                      <Image
                        src={`${basePath}${announcement.imgUrl}`}
                        alt={announcement.title}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 sm:ml-4">
                      <h4 className="text-scale-1200 text-normal mb-0 text-base">
                        {announcement.title}
                      </h4>
                      <p className="p text-sm">{announcement.description}</p>
                    </div>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
          <div className="pt-4">
            <TextLink url="/blog" label="Explore more" />
          </div>
        </div>
      </div>
    </div>
  )
}
=======
const Developers = () => (
  <>
    <ul className="border-b p-2">
      {DevelopersData['header'].map((component) => (
        <ListItem
          key={component.text}
          title={component.text}
          href={component.url}
          className="py-4"
        ></ListItem>
      ))}
    </ul>
    <ul className="grid gap-3 p-2 md:grid-cols-3 w-[650px] border-b">
      {DevelopersData['navigation'].map((column) => (
        <li key={column.label} className="p-2">
          <label className="text-muted text-xs font-mono">{column.label}</label>
          {column.links.map((link: Props) => (
            <TextLink key={link.text} url={link.url} label={link.text} />
          ))}
        </li>
      ))}
    </ul>
    <ul className="p-2 flex justify-between bg-alternative text-sm">
      <Link href={DevelopersData['footer']['support'].url}>
        <a className="p-2 hover:bg-[#101010] rounded">{DevelopersData['footer']['support'].text}</a>
      </Link>
      <Link href={DevelopersData['footer']['systemStatus'].url}>
        <a className="p-2 hover:bg-[#101010] rounded">
          {DevelopersData['footer']['systemStatus'].text}
        </a>
      </Link>
    </ul>
  </>
)
>>>>>>> 6e67410ae (setup developers nav dropdown layout)

export default Developers
