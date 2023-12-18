import CardButton from 'components/ui/CardButton'
import { useState } from 'react'

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
      description={description}
    />
  )
}

export default SQLCard
