import { AiIconAnimation } from '@ui/layout/ai-icon-animation'
import React from 'react'

export const AiIcon = () => <AiIconAnimation className="mr-2" allowHoverEffect />

export const AiIconChat = ({ loading = false }) => (
  <AiIconAnimation className="ml-0.5" loading={loading} allowHoverEffect />
)
