import dynamic from 'next/dynamic'

const LazyConfig = dynamic(() => import('./AuthSmsProviderConfig'))

const AuthSmsProviderConfig = () => <LazyConfig />

export { AuthSmsProviderConfig }
