import { useState, useReducer } from 'react'
import { supabase } from 'lib/supabaseClient'

const initialState = {
  email: '',
  fullname: '',
  password: '',
}
const reducer = (state, { field, value }) => {
  return {
    ...state,
    [field]: value,
  }
}
export default function SignUp() {
  const [errors, setErrors] = useState(null)
  const [state, dispatch] = useReducer(reducer, initialState)
  const onChange = (e) => {
    setErrors(null)
    dispatch({ field: e.target.name, value: e.target.value })
  }
  const signup = async () => {
    const { email, fullname, password } = state
    try {
      let { body, status } = await supabase.rpc('signup', {
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
        <label>Full name</label>
        <input type="text" name="fullname" value={state.fullname} onChange={onChange} />
      </div>

      <div>
        <label>Password</label>
        <input type="password" name="password" value={state.password} onChange={onChange} />
      </div>
      <div style={{ paddingTop: 20, paddingBottom: 20 }}>
        <button onClick={() => signup()}>Sign up</button>
      </div>
      {errors && <div>Error: {errors.toString()}</div>}
    </div>
  )
}
