export const IconBackground: React.FC<React.PropsWithChildren> = (props) => (
  <div className="shrink-0 bg-brand-200 dark:bg-brand-400 border border-brand-500 w-8 h-8 flex items-center justify-center rounded">
    {props.children}
  </div>
)
