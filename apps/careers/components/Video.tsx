const Video = () => {
  return (
    <section className="video" id="video">
      <div className="space-y-12">
        <div>
          <h1 className="text-center text-xl font-semibold">Hear from our Founders</h1>
          <div className="mx-4 mt-6 space-y-4 md:flex md:space-y-0 md:space-x-4">
            <div className="bg-brand-900 aspect-video w-full rounded-lg"></div>
            <div className="bg-brand-900 aspect-video w-full rounded-lg"></div>
          </div>
        </div>
        <div>
          <h1 className="text-center text-xl font-semibold">Hear from our employees</h1>
          <div className="mx-4 mt-6 space-y-4 md:flex md:space-y-0 md:space-x-4">
            <div className="bg-brand-900 aspect-video w-full rounded-lg"></div>
            <div className="bg-brand-900 aspect-video w-full rounded-lg"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Video
