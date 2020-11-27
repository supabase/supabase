import Authors from "./../data/Authors.json"

const ArticleThumb = (props: any) => {
  const {
    title,
    type,
    description,
    img_url,
    url,
    icons,
    publish_date,
    read_length,
    author,
    cta
  } = props.article

  // interface User {
  //   name :string;
  //   job_title :string;
  //   username: string;
  //   avatar_url :string;
  // }

  // console.log(props.article)

  // @ts-ignore
  const AuthorProfile: User = Authors[author]

  // console.log(AuthorProfile)

  const iconMarkup = icons && icons.map((icon :any) => {
    return (
      <img
        key={icon.img_alt}
        className="inline-block h-12 w-12 rounded-full ring-2 ring-white"
        src={icon.img_url}
        alt={icon.img_alt}
      />
    )
  })

  // console.log(icons)
  // console.log(iconMarkup)

  return (
    <div className="flex flex-col rounded-sm shadow-lg overflow-hidden">
      <div className="flex-shrink-0">
        <img
          className="h-48 w-full object-cover"
          src={img_url}
          alt={title}
        />
      </div>
      <div className="flex-1 bg-white p-6 flex flex-col justify-between">
        <div className="flex-1">
          {icons && (
            <div className="-mt-12 mb-6 flex -space-x-3">
              {iconMarkup}
            </div>
          )}
          <p className="text-sm font-medium text-gray-600">
            <a href="#" className="hover:underline capitalize">
              {type}
            </a>
          </p>
          <a href="#" className="block mt-2">
            <p className="text-xl text-gray-900">{title}</p>
            <p className="mt-3 text-base text-gray-500">
              {description}
            </p>
          </a>
        </div>
        { AuthorProfile && (
        <div className="mt-6 flex items-center">
          <div className="flex-shrink-0">
            <a href="#">
              <span className="sr-only">{AuthorProfile.name}</span>
              <img
                className="h-10 w-10 rounded-full"
                src={AuthorProfile.avatar_url}
                alt=""
              />
            </a>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              <a href="#" className="hover:underline">
                {AuthorProfile.name}
              </a>
            </p>
            <div className="flex space-x-1 text-sm text-gray-500">
              <time dateTime="2020-03-16">Mar 16, 2020</time>
              <span aria-hidden="true">&middot;</span>
              <span>6 min read</span>
            </div>
          </div>
        </div>
          )}
          { cta && (
            <div className="mt-6 flex items-center">
            <a href={url}>Learn more</a>
          </div>
          )}
      </div>
    </div>
  )
}

export default ArticleThumb
