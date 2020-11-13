import { useState } from 'react';
import { supabase } from '../utils/initSupabase';

export default function SupabaseAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (type, email, password) => {
    const { error, user } =
      type === 'LOGIN'
        ? await supabase.auth.signIn({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (!error && !user) alert('Check your email for the login link!');
    if (error) alert(error.message);
  };

  async function handleOAuthLogin(provider) {
    let { error } = await supabase.auth.signIn({ provider });
    if (error) alert(error.message);
  }

  async function forgotPassword() {
    const email = prompt('Please enter your email:');
    if (email === null || email === '')
      return alert('You must enter your email.');

    const { error } = await supabase.auth.api.resetPasswordForEmail(email);
    if (error) return alert(error.message);
    alert('Password recovery email has been sent.');
  }

  return (
    <div>
      <div>
        <label>Email</label>
        <input
          type="text"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <button
          onClick={() => {
            handleLogin('SIGNUP', email, password);
          }}
        >
          Sign up
        </button>
        <button
          onClick={() => {
            handleLogin('LOGIN', email, password);
          }}
        >
          {password.length ? 'Sign in' : 'Send magic link'}
        </button>
      </div>

      <div>
        <button onClick={forgotPassword}>Forgot your password?</button>
      </div>

      <div>
        <hr />
        <span>Or continue with</span>

        <div>
          <div>
            <button onClick={() => handleOAuthLogin('github')} type="button">
              GitHub
            </button>
          </div>
          <div>
            <button onClick={() => handleOAuthLogin('google')} type="button">
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
