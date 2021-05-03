import Button from 'components/Button'

type PostMetaProps = {
  name: string
  avatarUrl: string
  publishDate: string
  readLength: number
}

type Props = {
  title: string
  type: 'Project Example' | 'Case Study' | 'Blog Post'
  description: string
  imgUrl: string
  url: string
  logoUrl?: string
  ctaText?: string
  icons?: any[]
  postMeta?: PostMetaProps
}

const Card = (props: Props) => {
  const {
    title,
    type,
    description,
    imgUrl,
    url,
    logoUrl = '',
    ctaText = '',
    icons = [],
    postMeta = {
      name: '',
      avatarUrl: '',
      publishDate: '',
      readLength: '',
    },
  } = props

  const iconMarkup =
    icons &&
    icons.map((icon: any) => {
      return (
        <img
          key={icon.imgAlt}
          className="inline-block h-12 w-12 rounded-full ring-2 ring-white"
          src={icon.imgUrl}
          alt={icon.imgAlt}
        />
      )
    })

  return (
    <a
      href={url}
      target="_blank"
      className="flex flex-col rounded-md shadow-lg overflow-hidden relative transition transform hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="flex-shrink-0 dark:bg-dark-800">
        <img className="h-64 w-full object-cover" src={imgUrl} alt={title} />
      </div>
      <div className="flex-1 bg-white p-8 flex flex-col justify-between dark:bg-dark-700">
        <div className="flex-1">
          {/* {icons && (
            <div className="-mt-12 mb-6 flex -space-x-3">
              {iconMarkup}
            </div>
          )} */}
          <p className="text-sm font-base capitalize text-gray-600 dark:text-dark-300">{type}</p>
          <div className="mt-2 flex flex-col justify-between h-32">
            {/* {logoUrl && <img src={logoUrl} className="h-9 my-4" />} */}
            {title && <p className="text-xl text-gray-900 dark:text-white">{title}</p>}
            <p className="mt-3 text-base text-gray-500 dark:text-dark-400">
              {type !== 'Project Example' ? postMeta.publishDate : description}
            </p>
          </div>
        </div>
        {type === 'Case Study' && postMeta.name.length > 0 && (
          <div className="mt-6 flex items-center">
            <div className="flex-shrink-0">
              <span className="sr-only">{postMeta.name}</span>
              <img className="h-10 w-10 rounded-full" src={postMeta.avatarUrl} alt="" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{postMeta.name}</p>
              <div className="flex space-x-1 text-sm text-gray-500 dark:text-dark-100">
                <time dateTime="2020-03-16">{postMeta.publishDate}</time>
                <span aria-hidden="true">&middot;</span>
                <span>{postMeta.readLength} min read</span>
              </div>
            </div>
          </div>
        )}
        {ctaText && <Button className="mt-5" type="secondary" text={ctaText} url={url} />}
      </div>
    </a>
  )
}

export default Card
