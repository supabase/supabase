interface Props {
  caption: string
  img: string
}

export default function Avatar(props: Props) {
  const { caption, img } = props

  return (
    <div className="align-center m-0 flex h-8 items-center gap-3">
      <img
        src={'/images/blog/avatars/' + img}
        className="h-8 w-8 rounded-full object-cover text-center"
        style={{ margin: 0 }}
        alt={`${caption} avatar`}
      />
      <figcaption style={{ marginTop: 0 }} className="text-scale-1000">
        <p>{caption}</p>
      </figcaption>
    </div>
  )
}
