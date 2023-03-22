import React from 'react'

export const LoadingLine = ({ loading }: { loading: boolean }) => {
  return (
    <div className="loading-line">
      <span
        className={'loading-line--sprite' + (loading ? ' loading-line--stripe--animate' : '')}
      ></span>
    </div>
  )
}
