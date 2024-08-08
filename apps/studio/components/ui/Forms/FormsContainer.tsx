function FormsContainer(props: { children: React.ReactNode; header?: string }) {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-12 pb-20">
      {props.header && <h1 className="text-foreground mb-8 text-3xl">{props.header}</h1>}
      <div className="space-y-20">{props.children}</div>
    </div>
  )
}

export { FormsContainer }
