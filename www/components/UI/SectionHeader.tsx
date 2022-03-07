const SectionHeader = (props: any) => {
  return (
    <div className={'grid grid-cols-12 gap-1 sm:gap-8 ' + props.className}>
      <div className="relative grid py-12 col-span-12 grid-cols-12">
        <div className="col-span-12">
          <span className="col-span-12 block mb-6 text-sm tracking-widest uppercase text-scale-900 font-mono">
            {props.subtitle}
          </span>
          <h2>
            <span>{props.title}</span>
            {props.title_alt && (
              <span className="text-scale-900 inline">{props.title_alt}</span>
            )}
          </h2>
        </div>
        <div className="col-span-12 lg:col-span-7">
          {props.paragraph && (
            <p>
              <p className="mt-3 mx-auto text-xl sm:mt-4">{props.paragraph}</p>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SectionHeader
