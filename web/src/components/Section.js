import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types';


export default function Section({ title, id, style, children }) {
  const hash = String(id ? id : title).trim().replace(/\s/g, "-").toLowerCase();
  const sectionRef = useRef(null);

  useEffect(() => {
    function scrollOnHash() {
      const clearedLocationHash = window.location.hash.substring(1);

      if (clearedLocationHash == hash) {
        sectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }

    scrollOnHash();
  }, [])

  function handleHashClick() {
    sectionRef.current.scrollIntoView({ behavior: 'smooth' });

    setTimeout(() => {
      window.location.hash = hash;
    }, 500)
  }

  return (
    <section className="section-lg">
      <div className="container Section">
        <h2 className={`${stylePropOptions[style]} Section-Title`}
          ref={sectionRef}
          onClick={handleHashClick}
          id={hash}>
          {title}
          <span className="Section-Hash">#</span>
        </h2>
        <div>{children}</div>
      </div>
    </section>
  );
}

const stylePropOptions = {
  'underline': 'with-underline'
};

Section.propTypes = {
  title: PropTypes.string.isRequired,
  style: PropTypes.oneOf(['underline']),
}
