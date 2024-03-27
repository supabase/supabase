import dynamic from 'next/dynamic'

const DocsCommandMenu = dynamic(() => import('./CommandMenu'))

export { DocsCommandMenu }
