import { useState } from "react";
import { useLogin } from "@refinedev/core";

export default function Auth() {
    const [email, setEmail] = useState("");
    const { isLoading, mutate: login } = useLogin();
    
    const handleLogin = async (event: { preventDefault: () => void }) => {
      event.preventDefault();
      login({ email });
    };

  return (
    <div className="row flex flex-center container">
      <div className="col-6 form-widget">
        <h1 className="header">Supabase + refine</h1>
        <p className="description">Sign in via magic link with your email below</p>
        <form className="form-widget" onSubmit={handleLogin}>
          <div>
            <input
              className="inputField"
              type="email"
              placeholder="Your email"
              value={email}
              required={true}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <button className={"button block"} disabled={isLoading}>
              {isLoading ? <span>Loading</span> : <span>Send magic link</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
