import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, addTask, updateTask } from './Store'

export const TodoList = (props) => {
  const [newTaskText, setNewTaskText] = useState('')
  const { match } = props
  let { uuid } = match.params
  const { tasks, setTasks, list } = useStore({ uuid })

  return (
    <div>
      <Link to="/">back</Link>
      <h1>My Task List</h1>
      <label>Sharing url: </label>
      <input type="text" readonly value={window.location.href} />
      <div className={'field-row'}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setNewTaskText('')
          }}
        >
          <input id="newtask" type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} />
          <button type="submit" onClick={() => addTask(newTaskText, list.id)}>
            add task
          </button>
        </form>
      </div>
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
  )
}
