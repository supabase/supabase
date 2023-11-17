import React, { useState } from 'react'

import { DatePicker } from '.'
import ReactDatePicker from 'react-datepicker'

export default {
  title: 'Data/DatePicker',
  component: DatePicker,
}

export const Default = (args: any) => (
  <div style={{ margin: '0 auto', minHeight: '420px', marginTop: '220px' }}>
    <DatePicker />
  </div>
)

export const Simple = () => {
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(null)
  const onChange = (dates: any) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
  }
  return (
    <ReactDatePicker
      selected={startDate}
      onChange={onChange}
      startDate={startDate}
      endDate={endDate}
      selectsRange
      inline
    />
  )
}
