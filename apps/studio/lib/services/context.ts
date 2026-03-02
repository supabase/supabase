import { createContext, useContext } from 'react'

import type { ServiceRegistry } from './registry'

const ServiceRegistryContext = createContext<ServiceRegistry>(null!)

export const ServiceRegistryProvider = ServiceRegistryContext.Provider

export function useService<K extends keyof ServiceRegistry>(key: K): ServiceRegistry[K] {
  return useContext(ServiceRegistryContext)[key]
}
