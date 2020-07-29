import { useEffect, useRef } from 'react'

export default function TextLog({ log }) {
  const textLog = useRef(null)

  useEffect(() => {
    textLog.current.scrollTop = textLog.current.scrollHeight;
  }, [log])

  return (
    <>
      <textarea ref={textLog} readOnly value={log} />
      <style jsx>{`
        textarea {
          width: 100%;
          height: 7rem;
        }
      `}</style>
    </>
  )
}