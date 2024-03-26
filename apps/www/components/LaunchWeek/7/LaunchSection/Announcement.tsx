import { Announcement as AnnouncementType } from '../../types'

export const Announcement = (props: AnnouncementType) => {
  const containerClasses = []
  let imgSrc = ''
  let imgAlt = ''

  switch (props.type) {
    case 'soc2':
      containerClasses.push('text-blue-1200 border-blue-500 bg-blue-200')
      imgSrc = '/images/launchweek/soc-2-icon.png'
      imgAlt = 'soc2'
      break

    case 'producthunt':
      containerClasses.push('text-amber-1200 border-amber-500 bg-amber-300')
      imgSrc =
        'https://www.pngkey.com/png/full/1-10768_product-hunt-original-logo-product-hunt-kitty.png'
      imgAlt = 'producthunt'
    default:
      break
  }
  return (
    <button
      className={[
        'flex items-start gap-6 rounded-full border p-3 px-6 pr-8',
        containerClasses,
      ].join(' ')}
    >
      <div className="w-12 text-blue-900">
        <img src={imgSrc} alt={imgAlt} />
      </div>
      <div className="flex flex-col items-start gap-0">
        <span className="text-xl">{props.title}</span>
        <span className="text-blue-1000">{props.description}</span>
      </div>
    </button>
  )
}

export default Announcement
