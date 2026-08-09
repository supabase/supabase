// From: https://gist.github.com/adamwathan/3b9f3ad1a285a2d1b482769aeb862467

import { CSSTransition as ReactCSSTransition } from 'react-transition-group'
import React, { useRef, useEffect, useContext } from 'react'

const TransitionContext = React.createContext({
  parent: {},
})

function useIsInitialRender() {
  const isInitialRender = useRef(true)
  useEffect(() => {
    isInitialRender.current = false
  }, [])
  return isInitialRender.current
}

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

function Transition({ show, appear, ...rest }) {
  const { parent } = useContext(TransitionContext)
  const isInitialRender = useIsInitialRender()
  const isChild = show === undefined

  if (isChild) {
    return (
      <CSSTransition
        appear={parent.appear || !parent.isInitialRender}
        show={parent.show}
        {...rest}
      />
    )
  }

  return (
    <TransitionContext.Provider
      value={{
        parent: {
          show,
          isInitialRender,
          appear,
        },
      }}
    >
      <CSSTransition appear={appear} show={show} {...rest} />
    </TransitionContext.Provider>
  )
}

export default Transition
