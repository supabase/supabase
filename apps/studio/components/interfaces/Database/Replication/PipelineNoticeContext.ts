import { createContext } from 'react'

export const PipelineNoticeContext = createContext(false)

export const PipelineTableNoticeContext = createContext<HTMLDivElement | null>(null)
