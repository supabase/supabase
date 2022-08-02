import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'
import { Project } from 'types'
import { useProjectApiQuery } from './useProjectApi'
import { ProjectError, useProjectQuery } from './useProjectQuery'

type ProjectContextType = {
  project: Project | undefined
  projectError: ProjectError | null
  projectApiError: unknown | null
  isLoading: boolean
  isError: boolean
  supabaseClient: SupabaseClient | null
}

const ProjectContext = createContext<ProjectContextType>({
  project: undefined,
  projectError: null,
  projectApiError: null,
  isLoading: true,
  isError: false,
  supabaseClient: null,
})

export default ProjectContext

export const useProjectContext = () => useContext(ProjectContext)

type ProjectContextProviderProps = {
  projectRef: string | undefined
}

export const ProjectContextProvider = ({
  projectRef,
  children,
}: PropsWithChildren<ProjectContextProviderProps>) => {
  const { data, isLoading, isError, error: projectError } = useProjectQuery(projectRef)

  const {
    data: projectApiData,
    isLoading: isProjectApiLoading,
    isError: isProjectApiError,
    error: projectApiError,
  } = useProjectApiQuery(projectRef)

  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    if (projectApiData === undefined) {
      setSupabaseClient(null)
      return
    }

    const {
      app_config: { endpoint: serviceEndpoint },
      serviceApiKey,
    } = (projectApiData.projectApi as any).autoApiService

    const supabaseClient = createClient(`https://${serviceEndpoint}`, serviceApiKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        multiTab: false,
        detectSessionInUrl: false,
        localStorage: {
          getItem: () => {
            return null
          },
          setItem: () => {},
          removeItem: () => {},
        },
      },
    })

    setSupabaseClient(supabaseClient)
  }, [projectApiData])

  const value = useMemo<ProjectContextType>(
    () => ({
      project: data?.project,
      projectApi: projectApiData?.projectApi,
      isLoading: isLoading || isProjectApiLoading,
      isError: isError || isProjectApiError,
      projectError,
      projectApiError,
      supabaseClient,
    }),
    [data, isLoading, isError]
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}
