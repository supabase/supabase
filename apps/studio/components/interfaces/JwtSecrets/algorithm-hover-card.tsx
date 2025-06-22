import { GlobeLock } from 'lucide-react'
import React from 'react'

import { InfoPill } from '../../ui/InfoPill'
import { AlgorithmDetail, algorithmDetails } from './algorithm-details'

interface AlgorithmHoverCardProps {
  algorithm: keyof typeof algorithmDetails
  legacy?: boolean
}

export const AlgorithmHoverCard: React.FC<AlgorithmHoverCardProps> = ({ algorithm, legacy }) => {
  const details: AlgorithmDetail = algorithmDetails[algorithm]

  return (
    <InfoPill
      label={legacy ? `Legacy JWT Secret ${details.label}` : details.label}
      icon={<GlobeLock className="w-4" strokeWidth={1} />}
      title={details.name}
      description={details.description}
      links={details.links}
    />
  )
}
