const SectionHeader = (props: any) => {
  return (
    <div className={props.className}>
      <div className="space-y-4">
        <span className="block text-xs tracking-widest uppercase text-scale-900 font-mono">
          {props.subtitle}
        </span>
        <h3 className="h2">
          <span>{props.title}</span>
          {props.title_alt && <span className="text-scale-1100 inline">{props.title_alt}</span>}
        </h3>
      </div>
      {props.paragraph && <p className="p text-lg sm:mt-4 max-w-3xl">{props.paragraph}</p>}
    </div>
  )
}

export default SectionHeader
