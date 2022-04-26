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
      className="relative flex transform flex-col overflow-hidden rounded-md shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="dark:bg-dark-800 flex-shrink-0">
        <img className="h-64 w-full object-cover" src={imgUrl} alt={title} />
      </div>
      <div className="dark:bg-scale-300 flex flex-1 flex-col justify-between bg-white p-8">
        <div className="flex-1">
          {/* {icons && (
            <div className="-mt-12 mb-6 flex -space-x-3">
              {iconMarkup}
            </div>
          )} */}
          <p className="font-base dark:text-dark-300 text-sm capitalize text-gray-600">{type}</p>
          <div className="mt-2 flex h-32 flex-col justify-between">
            {/* {logoUrl && <img src={logoUrl} className="h-9 my-4" />} */}
            {title && <p className="text-xl text-gray-900 dark:text-white">{title}</p>}
            <p className="dark:text-dark-400 mt-3 text-base text-gray-500">
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
              <div className="dark:text-dark-100 flex space-x-1 text-sm text-gray-500">
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
