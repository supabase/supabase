import { cn } from 'ui'

function FormsContainer(props: { children: React.ReactNode; header?: string; className?: string }) {
  return (
    <div
      className={cn('mx-auto max-w-full xl:max-w-4xl px-4 md:px-5 pt-12 pb-20', props.className)}
    >
      {props.header && <h1 className="text-foreground mb-8 text-3xl">{props.header}</h1>}
      <div className="space-y-12 md:space-y-20">{props.children}</div>
    </div>
  )
}

export { FormsContainer }
