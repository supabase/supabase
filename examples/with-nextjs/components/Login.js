import { useState, useReducer } from 'react'
import { supabase } from 'lib/supabaseClient'

const initialState = {
  email: '',
  password: '',
}
const reducer = (state, { field, value }) => {
  return {
    ...state,
    [field]: value,
  }
}
export default function Login() {
  const [errors, setErrors] = useState(null)
  const [state, dispatch] = useReducer(reducer, initialState)
  const onChange = (e) => {
    setErrors(null)
    dispatch({ field: e.target.name, value: e.target.value })
  }
  const login = async () => {
    const { email, fullname, password } = state
    try {
      let { body, status } = await supabase.rpc('login', {
        email,
        fullname,
        password,
      })
      console.log('body', body)
    } catch (error) {
      console.log('Error: ', error)
      setErrors(error.message)
    }
  }

  return (
    <div>
      <div>
        <label>Email</label>
        <input type="text" name="email" value={state.email} onChange={onChange} />
      </div>
      <div>
        <label>Password</label>
        <input type="password" name="password" value={state.password} onChange={onChange} />
      </div>
      <div style={{ paddingTop: 20, paddingBottom: 20 }}>
        <button onClick={() => login()}>Login</button>
      </div>
      {errors && <div>Error: {errors.toString()}</div>}
    </div>
  )
}
