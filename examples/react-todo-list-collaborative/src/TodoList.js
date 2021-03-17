import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, addTask, updateTask } from './Store'

export const TodoList = (uuid) => {
  const [newTaskText, setNewTaskText] = useState('')
  const { tasks, setTasks, list } = useStore({ uuid })

  return (
    <div className="container">
      <Link to="/">back</Link>
      <h1 className="section">My Task List</h1>
      <div className="section">
        <label>Sharing url: </label>
        <input type="text" readOnly value={window.location.href} />
      </div>
      <div className={'field-row section'}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setNewTaskText('')
          }}
        >
          <input
            id="newtask"
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
          />
          <button type="submit" onClick={() => (newTaskText ? addTask(newTaskText, list.id) : '')}>
            add task
          </button>
        </form>
      </div>
      <div className="section">
        {tasks
          ? tasks.map((task) => {
              return (
                <div key={task.id} className={'field-row'}>
                  <input
                    checked={task.complete ? true : ''}
                    onChange={(e) => {
                      tasks.find((t, i) => {
                        if (t.id === task.id) {
                          tasks[i].complete = !task.complete
                          return true
                        } else {
                          return false
                        }
                      })
                      setTasks([...tasks])
                      updateTask(task.id, { complete: e.target.checked })
                    }}
                    type="checkbox"
                    id={`task-${task.id}`}
                  ></input>
                  <label htmlFor={`task-${task.id}`}>
                    {task.complete ? <del>{task.task_text}</del> : task.task_text}
                  </label>
                </div>
              )
            })
          : ''}
      </div>
      <div className="section">
        <small>
          warning: do not store any sensitive information in this list, it is not secure
        </small>
      </div>
    </div>
  )
}
