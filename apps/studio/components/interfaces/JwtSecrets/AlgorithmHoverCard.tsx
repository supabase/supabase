import React from 'react'
import { GlobeLock } from 'lucide-react'
import { algorithmDetails, AlgorithmDetail } from './algorithmDetails'
import { InfoPill } from '../../ui/InfoPill'

interface AlgorithmHoverCardProps {
  algorithm: keyof typeof algorithmDetails
}

export const AlgorithmHoverCard: React.FC<AlgorithmHoverCardProps> = ({ algorithm }) => {
  const details: AlgorithmDetail = algorithmDetails[algorithm]

  return (
    <InfoPill
      label={details.label}
      icon={<GlobeLock className="w-4" strokeWidth={1} />}
      title={details.name}
      description={details.description}
      links={details.links}
    />
  )
}
