import dynamic from 'next/dynamic'

const LazySqlToRest = dynamic(() => import('./sql-to-rest'), { ssr: false })

const SqlToRest = () => <LazySqlToRest />

export { SqlToRest }
