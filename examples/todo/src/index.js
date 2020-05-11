import React from 'react'
import './index.css'
import { BrowserRouter as Router, Route, Switch, useHistory } from 'react-router-dom'
import { render } from 'react-dom'
import { TodoList } from './TodoList'
import * as serviceWorker from './serviceWorker'
import { v4 as uuidv4 } from 'uuid'
import { createList } from './Store'
import queryString from 'query-string'

const newList = async (history) => {
  const list = await createList(uuidv4())
  history.push(`/?uuid=${list.uuid}`)
}

const Home = (props) => {
  const history = useHistory()
  const uuid = queryString.parse(props.location.search).uuid

  if (uuid) return TodoList(uuid)
  else {
    return (
      <div className="container">
        <div className="section">
          <h1>Collaborative Task Lists</h1>
          <small>
            Powered by <a href="https://supabase.io">Supabase</a>
          </small>
        </div>
        <div className="section">
          <button
            onClick={() => {
              newList(history)
            }}
          >
            new task list
          </button>
        </div>
      </div>
    )
  }
}

render(
  <div className="App">
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
      </Switch>
    </Router>
  </div>,
  document.body
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
