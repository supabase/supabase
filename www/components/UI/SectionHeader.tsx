const SectionHeader = (props :any) => {
  return (
    <div className={"grid grid-cols-12 gap-8 " + props.className}>
      <div className="relative py-12 col-span-12">
        <span className="block mb-6 text-sm tracking-widest uppercase text-gray-400 font-mono">
          {props.subtitle}
        </span>
        <h2 className="text-gray-900 text-3xl md:text-4xl lg:text-5xl">
          {props.title}
          {props.title_alt && (
            <span className="text-gray-600">{props.title_alt}</span>
          )}
        </h2>
        <p>
          {props.paragraph && (
        <p className="mt-3 mx-auto text-xl text-gray-400 sm:mt-4">
          {props.paragraph}
        </p>
          )}
        </p>
      </div>
    </div>
  )
}

export default SectionHeader