// modified, unhooked version

import React from 'react'
import { CSSTransition as ReactCSSTransition } from 'react-transition-group'
import PropTypes from 'prop-types'

// function useIsInitialRender() {
//   const isInitialRender = useRef(true)
//   useEffect(() => {
//     isInitialRender.current = false
//   }, [])
//   return isInitialRender.current
// }

function CSSTransition({
  show,
  enter = '',
  enterFrom = '',
  enterTo = '',
  leave = '',
  leaveFrom = '',
  leaveTo = '',
  appear,
  children,
}) {
  const enterClasses = enter.split(' ').filter((s) => s.length)
  const enterFromClasses = enterFrom.split(' ').filter((s) => s.length)
  const enterToClasses = enterTo.split(' ').filter((s) => s.length)
  const leaveClasses = leave.split(' ').filter((s) => s.length)
  const leaveFromClasses = leaveFrom.split(' ').filter((s) => s.length)
  const leaveToClasses = leaveTo.split(' ').filter((s) => s.length)

  function addClasses(node, classes) {
    classes.length && node.classList.add(...classes)
  }

  function removeClasses(node, classes) {
    classes.length && node.classList.remove(...classes)
  }

  return (
    <ReactCSSTransition
      appear={appear}
      unmountOnExit
      in={show}
      addEndListener={(node, done) => {
        node.addEventListener('transitionend', done, false)
      }}
      onEnter={(node) => {
        addClasses(node, [...enterClasses, ...enterFromClasses])
      }}
      onEntering={(node) => {
        removeClasses(node, enterFromClasses)
        addClasses(node, enterToClasses)
      }}
      onEntered={(node) => {
        removeClasses(node, [...enterToClasses, ...enterClasses])
      }}
      onExit={(node) => {
        addClasses(node, [...leaveClasses, ...leaveFromClasses])
      }}
      onExiting={(node) => {
        removeClasses(node, leaveFromClasses)
        addClasses(node, leaveToClasses)
      }}
      onExited={(node) => {
        removeClasses(node, [...leaveToClasses, ...leaveClasses])
      }}
    >
      {children}
    </ReactCSSTransition>
  )
}

function TransitionCompiler({ show, appear, ...rest }) {
  return (
    <CSSTransition appear={appear} show={show} {...rest} />
  )
}

const Transition = ({
  show = true,
  enter = 'ease-out duration-200',
  enterFrom = 'opacity-0',
  enterTo = 'opacity-100',
  leave = 'ease-in duration-200',
  leaveFrom = 'opacity-100',
  leaveTo = 'opacity-0',
  children
}) => {
  return (
    <TransitionCompiler
      show={show}
      enter={enter}
      enterFrom={enterFrom}
      enterTo={enterTo}
      leave={leave}
      leaveFrom={leaveFrom}
      leaveTo={leaveTo}
    >
      {children}
    </TransitionCompiler>
  )
}

Transition.propTypes = {
  show: PropTypes.bool,
  enter: PropTypes.string,
  enterFrom: PropTypes.string,
  enterTo: PropTypes.string,
  leave: PropTypes.string,
  leaveFrom: PropTypes.string,
  leaveTo: PropTypes.string,
}

export default Transition

// // From: https://gist.github.com/adamwathan/3b9f3ad1a285a2d1b482769aeb862467

// import React, { useRef, useEffect, useContext } from 'react'
// import { CSSTransition as ReactCSSTransition } from 'react-transition-group'
// import PropTypes from 'prop-types'

// const TransitionContext = React.createContext({
//   parent: {},
// })

// function useIsInitialRender() {
//   const isInitialRender = useRef(true)
//   useEffect(() => {
//     isInitialRender.current = false
//   }, [])
//   return isInitialRender.current
// }

// function CSSTransition({
//   show,
//   enter = '',
//   enterFrom = '',
//   enterTo = '',
//   leave = '',
//   leaveFrom = '',
//   leaveTo = '',
//   appear,
//   children,
// }) {
//   const enterClasses = enter.split(' ').filter((s) => s.length)
//   const enterFromClasses = enterFrom.split(' ').filter((s) => s.length)
//   const enterToClasses = enterTo.split(' ').filter((s) => s.length)
//   const leaveClasses = leave.split(' ').filter((s) => s.length)
//   const leaveFromClasses = leaveFrom.split(' ').filter((s) => s.length)
//   const leaveToClasses = leaveTo.split(' ').filter((s) => s.length)

//   function addClasses(node, classes) {
//     classes.length && node.classList.add(...classes)
//   }

//   function removeClasses(node, classes) {
//     classes.length && node.classList.remove(...classes)
//   }

//   return (
//     <ReactCSSTransition
//       appear={appear}
//       unmountOnExit
//       in={show}
//       addEndListener={(node, done) => {
//         node.addEventListener('transitionend', done, false)
//       }}
//       onEnter={(node) => {
//         addClasses(node, [...enterClasses, ...enterFromClasses])
//       }}
//       onEntering={(node) => {
//         removeClasses(node, enterFromClasses)
//         addClasses(node, enterToClasses)
//       }}
//       onEntered={(node) => {
//         removeClasses(node, [...enterToClasses, ...enterClasses])
//       }}
//       onExit={(node) => {
//         addClasses(node, [...leaveClasses, ...leaveFromClasses])
//       }}
//       onExiting={(node) => {
//         removeClasses(node, leaveFromClasses)
//         addClasses(node, leaveToClasses)
//       }}
//       onExited={(node) => {
//         removeClasses(node, [...leaveToClasses, ...leaveClasses])
//       }}
//     >
//       {children}
//     </ReactCSSTransition>
//   )
// }

// function TransitionCompiler({ show, appear, ...rest }) {
//   const { parent } = useContext(TransitionContext)
//   const isInitialRender = useIsInitialRender()
//   const isChild = show === undefined

//   if (isChild) {
//     return (
//       <CSSTransition
//         appear={parent.appear || !parent.isInitialRender}
//         show={parent.show}
//         {...rest}
//       />
//     )
//   }

//   return (
//     <TransitionContext.Provider
//       value={{
//         parent: {
//           show,
//           isInitialRender,
//           appear,
//         },
//       }}
//     >
//       <CSSTransition appear={appear} show={show} {...rest} />
//     </TransitionContext.Provider>
//   )
// }

// const Transition = ({
//   show = true,
//   enter = 'ease-out duration-200',
//   enterFrom = 'opacity-0',
//   enterTo = 'opacity-100',
//   leave = 'ease-in duration-200',
//   leaveFrom = 'opacity-100',
//   leaveTo = 'opacity-0',
// }) => {
//   return (
//     <TransitionCompiler
//       show={show}
//       enter={enter}
//       enterFrom={enterFrom}
//       enterTo={enterTo}
//       leave={leave}
//       leaveFrom={leaveFrom}
//       leaveTo={leaveTo}
//     />
//   )
// }

// Transition.propTypes = {
//   show: PropTypes.bool,
//   enter: PropTypes.string,
//   enterFrom: PropTypes.string,
//   enterTo: PropTypes.string,
//   leave: PropTypes.string,
//   leaveFrom: PropTypes.string,
//   leaveTo: PropTypes.string,
// }

// export default Transition
