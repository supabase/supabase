import Image from 'next/image'

interface Props {
  caption: string
  img: string
}

export default function Avatar(props: Props) {
  const { caption, img } = props

  return (
    <div className="align-center m-0 flex h-8 items-center gap-3">
      <Image
        src={'/images/blog/avatars/' + img}
        className="h-8 w-8 rounded-full object-cover text-center m-0"
        alt={`${caption} avatar`}
        width={32}
        height={32}
      />
      <figcaption style={{ marginTop: 0 }} className="text-foreground-lighter">
        <p>{caption}</p>
      </figcaption>
    </div>
  )
}
