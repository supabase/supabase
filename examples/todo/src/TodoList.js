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
      <Link to="/">Home</Link>
      <h1>My Todo List</h1>
      <h3>{uuid}</h3>
      <div className={'field-row'}>
        <input id="newtask" type="text" onChange={(e) => setNewTaskText(e.target.value)} />
        <label htmlFor="newtask">
          <button onClick={() => addTask(newTaskText, list.id)}>add</button>
        </label>
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
                <label htmlFor={`task-${task.id}`}>{task.task_text}</label>
              </div>
            )
          })
        : ''}
    </div>
  )
}
