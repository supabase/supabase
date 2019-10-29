import React, { useState, useEffect } from 'react'

export default function SignUpForm() {
  const [email, setEmail] = useState('')
  return (
    <form
      action="https://gmail.us5.list-manage.com/subscribe/post?u=c6785f4e1c9c77f231e367f6e&amp;id=18cccc8b62"
      method="post"
      id="mc-embedded-subscribe-form"
      name="mc-embedded-subscribe-form"
      className="field is-grouped"
      target="_blank"
      noValidate
    >
      <p className="control is-expanded">
        <input
          type="email"
          value={email}
          name="EMAIL"
          className="input email"
          id="mce-EMAIL"
          placeholder="your@email.com"
          onChange={e => setEmail(e.target.value)}
          required
        />
      </p>
      <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
        <input type="text" name="b_c6785f4e1c9c77f231e367f6e_18cccc8b62" tabIndex="-1" />
      </div>
      <div className="control">
        <input
          type="submit"
          value="Early Sign Up"
          name="subscribe"
          id="mc-embedded-subscribe"
          className="button is-primary"
        />
      </div>
    </form>
  )
}
