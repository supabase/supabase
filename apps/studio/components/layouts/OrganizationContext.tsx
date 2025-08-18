import { createContext, PropsWithChildren, useContext, useMemo } from 'react'
import { Organization } from '../../types'
import { useOrganizationQuery } from '../../data/organizations/organization-query'

export interface OrganizationContextType {
  organization?: Organization
  isLoading: boolean
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: undefined,
  isLoading: true,
})

export default OrganizationContext

export const useOrganizationContext = () => useContext(OrganizationContext)

type OrganizationContextProviderProps = {
  organizationSlug: string | undefined
}

export const OrganizationContextProvider = ({
                                              organizationSlug,
                                              children,
                                            }: PropsWithChildren<OrganizationContextProviderProps>) => {
  const { data: selectedOrganization, isLoading } = useOrganizationQuery({ slug: organizationSlug })

  const value = useMemo<OrganizationContextType>(() => {
    return {
      organization: selectedOrganization as unknown as Organization,
      isLoading,
    }
  }, [selectedOrganization, isLoading])

  return (
    <OrganizationContext.Provider value={ value }>
      { children }
    </OrganizationContext.Provider>
  )
}
