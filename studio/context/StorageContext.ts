import React from 'react'

interface IStorageContext {
  openBucketModal: (e: any) => void
}

export const StorageContext = React.createContext<Partial<IStorageContext>>({})
