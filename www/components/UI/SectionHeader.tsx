const SectionHeader = (props :any) => {
  return (
    <div className={"grid grid-cols-12 gap-1 sm:gap-8 " + props.className}>
      <div className="relative py-12 col-span-12">
        <span className="block mb-6 text-sm tracking-widest uppercase text-gray-400 font-mono">
          {props.subtitle}
        </span>
        <h2 className="text-gray-900 dark:text-white text-3xl md:text-4xl lg:text-5xl">
          {props.title}
          {props.title_alt && (
            <span className="text-gray-600 dark:text-gray-400 block lg:inline">{props.title_alt}</span>
          )}
        </h2>
        <div>
          {props.paragraph && (
            <p className="mt-3 mx-auto text-xl text-gray-400 dark:text-gray-200 sm:mt-4">
              {props.paragraph}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SectionHeader