import { cn } from 'ui'

function ChatIcon(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('absolute', 'top-2 left-2', 'ml-1 w-6 h-6 rounded-full bg-dbnew')}
      {...props}
    ></div>
  )
}

export { ChatIcon }
