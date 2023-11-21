const Loader = () => {
  return (
    <div className="p-4 flex flex-col gap-y-4">
      <div
        className="rounded w-full h-14 shimmering-loader"
        style={{ animationFillMode: 'backwards' }}
      />
      <div
        className="rounded w-full h-14 shimmering-loader"
        style={{ animationFillMode: 'backwards' }}
      />
      <div
        className="rounded w-full h-14 shimmering-loader"
        style={{ animationFillMode: 'backwards' }}
      />
    </div>
  )
}

export default Loader
