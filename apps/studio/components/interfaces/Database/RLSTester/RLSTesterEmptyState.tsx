import { ListTodo } from 'lucide-react'

export const RLSTesterEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <ListTodo className="mb-2 text-foreground-light" />
      <p className="text-foreground-light text-sm">Test summary and results will be shown here</p>
      <p className="text-foreground-lighter text-sm">
        Verify that the results match what your RLS policies allow
      </p>
    </div>
  )
}
