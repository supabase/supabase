const ZoomContent = ({ img }: { img: React.ReactElement | null }) => {
  return (
    <figure
      className="
        [&_img]:rounded-md
        [&_img]:border
        [&_img]:bg-default
      "
    >
      {img}
    </figure>
  )
}

export default ZoomContent
