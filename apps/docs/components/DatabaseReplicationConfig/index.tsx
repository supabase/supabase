import dynamic from 'next/dynamic'

const LazyConfig = dynamic(() => import('./DatabaseReplicationConfig'))

const DatabaseReplicationConfig = () => <LazyConfig />

export { DatabaseReplicationConfig }
