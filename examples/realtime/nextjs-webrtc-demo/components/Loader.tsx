const Loader = () => {
  return (
    <div className="bg-scale-200 h-screen w-screen flex flex-col items-center justify-center space-y-4">
      <span className="flex h-5 w-5 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-900 opacity-75" />
        <span className="relative inline-flex rounded-full h-full w-full bg-green-900" />
      </span>
    </div>
  )
}

export default Loader
