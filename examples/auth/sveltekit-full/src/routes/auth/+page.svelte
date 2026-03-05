<h2>Login with Email</h2>
<form method="POST" action="?/login">
  <label>
    Email
    <input name="email" type="email" />
  </label>
  <label>
    Password
    <input name="password" type="password" />
  </label>
  <button>Login</button>
  <button formaction="?/signup">Sign up</button>
</form>

<hr />

<h2>Login with OAuth</h2>
<form method="POST" action="?/oauth">
  <input type="hidden" name="provider" value="github" />
  <button>Login with GitHub</button>
</form>

<form method="POST" action="?/oauth">
  <input type="hidden" name="provider" value="google" />
  <button>Login with Google</button>
</form>