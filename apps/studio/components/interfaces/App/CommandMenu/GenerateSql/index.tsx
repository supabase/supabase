import { Book } from 'lucide-react'

import { useRegisterCommands, useRegisterPage, useSetPage } from 'ui-patterns/CommandMenu'

import { GenerateSql } from './GenerateSql'

const GENERATE_SQL_PAGE_NAME = 'generate_sql'

const useGenerateSqlCommand = () => {
  const setCommandPage = useSetPage()
  useRegisterPage(GENERATE_SQL_PAGE_NAME, GenerateSql)

  useRegisterCommands('Experimental', [
    {
      id: 'generate-sql',
      name: 'Generate SQL with Supabase AI',
      action: () => {
        setCommandPage(GENERATE_SQL_PAGE_NAME)
      },
      icon: () => <Book />,
      badge: () => <></>,
    },
  ])
}

export { useGenerateSqlCommand }
