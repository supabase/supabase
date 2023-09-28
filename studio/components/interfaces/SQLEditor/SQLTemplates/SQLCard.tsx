import { useState } from 'react'
import CardButton from 'components/ui/CardButton'

export interface SQLCardProps {
  title: string
  description: string
  sql: string
  onClick: (sql: string, title: string) => void
}

const SQLCard = ({ title, description, sql, onClick }: SQLCardProps) => {
  const [loading, setLoading] = useState(false)

  function handleOnClick() {
    setLoading(true)
    onClick(sql, title)
  }
  return (
    <CardButton
      title={title}
      loading={loading}
      onClick={() => handleOnClick()}
      footer={<span className="text-scale-1100 text-sm">{description}</span>}
    />
  )
}

export default SQLCard
