const SectionHeader = (props: any) => {
  return (
    <div className={props.className}>
      <div className="space-y-4">
        <span className="text-foreground-lighter block font-mono text-xs uppercase tracking-widest">
          {props.subtitle}
        </span>
        <h3 className="text-2xl lg:text-4xl scroll-mt-20 !leading-[1.2] text-foreground-light lg:max-w-md">
          {props.title}
        </h3>
      </div>
      {props.paragraph && (
        <p className="text-foreground-lighter max-w-3xl text-lg sm:mt-4">{props.paragraph}</p>
      )}
    </div>
  )
}

export default SectionHeader
