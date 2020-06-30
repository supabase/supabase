import { useState, useReducer } from 'react'
import Login from 'components/Login'
import SignUp from 'components/SignUp'

export default function Auth() {
  

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1 }}>
        <h3>Sign up</h3>
        <div>
          <SignUp />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <h3>Login</h3>
        <div>
          <Login />
        </div>
      </div>
    </div>
  )
}
