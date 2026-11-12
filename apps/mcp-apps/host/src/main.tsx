import './host.css'

import { createRoot } from 'react-dom/client'

import { HostApp } from './HostApp'

// No StrictMode: double-mounting would connect every view's bridge twice.
createRoot(document.getElementById('root')!).render(<HostApp />)
