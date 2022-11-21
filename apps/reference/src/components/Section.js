import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

export default function Section({ title, id, style, children }) {
  const hash = String(id ? id : title)
    .trim()
    .replace(/\s/g, '-')
    .toLowerCase()
  const sectionRef = useRef(null)

  useEffect(() => {
    function scrollOnHash() {
      const clearedLocationHash = window.location.hash.substring(1)

      if (clearedLocationHash == hash) {
        sectionRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }

    function changeHash() {
      const el = document.getElementById(hash)

      if (el) {
        const elementPos = el.getBoundingClientRect()

        if (elementPos.top <= 80 && elementPos.top >= 0) replaceHistoryHash()
      }
    }
    scrollOnHash()
    window.addEventListener('scroll', changeHash)

    return () => {
      window.removeEventListener('scroll', changeHash)
    }
  }, [])

  function replaceHistoryHash() {
    history.replaceState(history.state, '', `#${hash}`)
  }

  function handleHashClick() {
    replaceHistoryHash()
    sectionRef.current.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="section-lg">
      <div className="Section container">
        <h2
          className={`${stylePropOptions[style]} Section-Title`}
          ref={sectionRef}
          onClick={handleHashClick}
          id={hash}
        >
          {title}
          <span className="Section-Hash">#</span>
        </h2>
        <div>{children}</div>
      </div>
    </section>
  )
}

const stylePropOptions = {
  underline: 'with-underline',
}

Section.propTypes = {
  title: PropTypes.string.isRequired,
  style: PropTypes.oneOf(['underline']),
}
