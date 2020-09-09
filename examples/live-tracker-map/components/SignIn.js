import React, { useState, useEffect } from 'react'
import { auth } from 'lib/Store'

/**
 * Sign in with username and password
 * 
 * @param {String}       role     DRIVER/MANAGER. default as DRIVER
 */
export default function SignIn({ role = "DRIVER" }) {
  const [formData, updateFormData] = useState({ role });
  const [action, setAction] = useState(null);

  function onChange(e) {
    updateFormData({
      ...formData,

      // Trimming any whitespace
      [e.target.name]: e.target.value.trim()
    });
  };

  async function postAndWait(url, data, options = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
      ...options,
    })
    const body = await response.json()
    return body
  }

  async function onSubmit(event) {
    event.preventDefault();

    try {
      if (action === "SIGNUP") {
        const signupResponse = await postAndWait(`/api/auth/signup`, formData)
        await auth.loginWithRefreshToken(signupResponse.refresh_token, true)
        window.location.reload();
      } else if (action === "LOGIN") {
        const loginResponse = await postAndWait(`/api/auth/login`, formData)
        await auth.loginWithRefreshToken(loginResponse.refresh_token, true)
        window.location.reload();
      }
    } catch (error) {
      console.log('error', error)
      alert("Authentication failed. Please check your input.")
    }
  }

  return (
    <form className="container" onSubmit={onSubmit}>
      <label>
        Email
        <input name="email" type='email' onChange={onChange} />
      </label>
      <label>
        Password
        <input name="password" type='password' onChange={onChange} />
      </label>
      <button type='submit' onClick={() => setAction("SIGNUP")}>Sign up</button>
      <button type='submit' onClick={() => setAction("LOGIN")}>Login</button>
      <style jsx>{`
        .container {
          min-width: 20rem;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
        }
        
        label {
          display: flex;
          flex-direction: column;
          margin-bottom: 1rem;
        }
        
        input {
          margin-top: 0.5rem;
          padding: 0.5rem;
          font-size: 1rem;
        }
        
        button {
          margin-top: 0.5rem;
          padding: 0.5rem;
          font-size: 1rem;
        }
      `}</style>
    </form>
  )
}