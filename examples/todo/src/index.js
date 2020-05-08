import React from 'react'
import './index.css'
import { BrowserRouter as Router, Route, Switch, useHistory } from 'react-router-dom'
import { render } from 'react-dom'
import { TodoList } from './TodoList'
import * as serviceWorker from './serviceWorker'
import { v4 as uuidv4 } from 'uuid'
import { createList } from './Store'

const newList = async (history) => {
  const list = await createList(uuidv4())
  history.push(`/${list.uuid}`)
}

const Home = () => {
  const history = useHistory()
  return (
    <div className='container'>
      <button
        onClick={() => {
          newList(history)
        }}
      >
        new task list
      </button>
    </div>
  )
}

render(
  <div className="App">
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/:uuid" component={TodoList} />
      </Switch>
    </Router>
  </div>,
  document.body
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
