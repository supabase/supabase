import React, { useState } from 'react'
import axios from 'axios'
import './App.css';

function App() {
  const [firstName, setFirstName] = useState('')
  const [userList, setUserList] = useState([{ first_name: 'Paul' }])
  
  const onAddUserClicked = async () => {
    try {
      addUser(firstName)
      setFirstName('')
    } catch (error) {
      console.log('error', error)
    }
  }

  return (
    <div className="App">
      <div><input value={firstName} type="text" onChange={e => setFirstName(e.target.value)}/></div>
      <div><button onClick={onAddUserClicked}>Add User</button></div>
      <div>{userList.map(user => <p key={user.first_name}>{user.first_name}</p>)}</div>
    </div>
  )
}

export default App;

const addUser = async (first_name) => {
  let url = `${window.location.host}:3000/users`
  console.log('url', url)
  return axios.post(url, { first_name })
}