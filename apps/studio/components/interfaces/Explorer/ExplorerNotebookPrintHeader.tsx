import dayjs from 'dayjs'

import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface ExplorerNotebookPrintHeaderProps {
  name: string
}

export const ExplorerNotebookPrintHeader = ({ name }: ExplorerNotebookPrintHeaderProps) => {
  const { data: project } = useSelectedProjectQuery()

  return (
    <div className="hidden print:block mb-6 max-w-xl mx-auto px-3.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <img src="/img/supabase-logo.svg" alt="" className="h-4 w-4" />
            <span className="text-sm font-medium text-foreground">Supabase</span>
          </div>
          <p className="text-[10px] uppercase tracking-wide text-foreground-lighter mt-0.5">
            Explorer Notebook
          </p>
        </div>
        <div className="text-right text-xs text-foreground-lighter">
          <p className="font-medium text-foreground">{name}</p>
          <p>Project: {project?.name}</p>
          <p>Exported {dayjs().format('MMM D, YYYY')}</p>
        </div>
      </div>
      <div className="border-t-2 border-brand my-3" />
    </div>
  )
}
