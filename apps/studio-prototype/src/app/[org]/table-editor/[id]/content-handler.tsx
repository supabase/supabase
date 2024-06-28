'use client'

import { useParams } from 'next/navigation'
import Sql from './sql'
import Table from './table'

export default function ContentHandler() {
  const { id } = useParams()

  return Number(id) === 1 ? <Table /> : <Sql />
}
