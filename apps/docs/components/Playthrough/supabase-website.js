import React from "react";

export function Login({ onEvent }) {
  return (
    <div style={{ width: 400 }}>
      <img
        src="https://app.supabase.com/_next/image?url=%2Fimg%2Fsupabase-dark.svg&w=128&q=75"
        width="200px"
        style={{ display: "block", margin: "0 auto 60px" }}
      />
      <button
        style={{
          background: "#40bf86",
          borderRadius: ".25rem",
          padding: ".5rem 1rem",
          fontWeight: "bold",
          color: "white",
          cursor: "pointer",
        }}
        onClick={() => onEvent("login")}
      >
        Sign In with GitHub
      </button>
      <p style={{ color: "#a0a0a0", fontSize: 12 }}>
        By continuing, you agree to Supabase's Terms of Service and Privacy
        Policy, and to receive periodic emails with updates.
      </p>
    </div>
  );
}

export function NewProject({ onEvent }) {
  return (
    <div style={{ width: 400 }}>
      <div style={{ textAlign: "left", marginBottom: 12 }}>
        Lorem Ipsum's Org
      </div>
      <div style={{ borderRadius: 4, border: "1px dashed #333" }}>
        <h2 style={{ fontSize: 18 }}>No projects</h2>
        <p style={{ fontSize: 14, color: "#999" }}>
          Get started by creating a new project.
        </p>
        <button
          style={{
            background: "#40bf86",
            borderRadius: ".25rem",
            padding: ".5rem 1rem",
            fontWeight: "bold",
            color: "white",
            cursor: "pointer",
            marginBottom: 12,
          }}
          onClick={() => onEvent("login")}
        >
          New Project
        </button>
      </div>
    </div>
  );
}
export function Launching({ onEvent }) {
  return <div>Launching database...</div>;
}
export function Button({ onEvent, text }) {
  return (
    <div>
      <div style={{ fontSize: 14, color: "#999", marginBottom: 24 }}>
        [rest of the UI]
      </div>
      <button
        style={{
          background: "#40bf86",
          borderRadius: ".25rem",
          padding: ".5rem 1rem",
          fontWeight: "bold",
          color: "white",
          cursor: "pointer",
          marginBottom: 12,
        }}
        onClick={() => onEvent(text)}
      >
        {text}
      </button>
    </div>
  );
}
export function ProjectDetails({ onEvent }) {
  const ref = React.useRef();
  return (
    <div style={{ width: 400 }}>
      <div
        style={{ borderRadius: 4, background: "#262626", textAlign: "left" }}
      >
        <div style={{ padding: 14 }}>Create a new project</div>
        <div>
          <span
            style={{
              display: "inline-block",
              width: 100,
              padding: "6px 14px",
              color: "#bbb",
            }}
          >
            Name
          </span>
          <input ref={ref}></input>
          <br />

          <span
            style={{
              display: "inline-block",
              width: 100,
              padding: "6px 14px",
              color: "#bbb",
            }}
          >
            Password
          </span>
          <input type="password"></input>
        </div>
        <div style={{ padding: 14, textAlign: "right" }}>
          <button
            style={{
              background: "#40bf86",
              borderRadius: ".25rem",
              padding: ".25rem 1rem",
              fontWeight: "bold",
              color: "white",
              cursor: "pointer",
            }}
            onClick={() => {
              onEvent("create", ref.current.value);
              setTimeout(() => {
                console.log("timeout");
                onEvent("launch database");
              }, 2000);
            }}
          >
            Create new Project
          </button>
        </div>
      </div>
    </div>
  );
}
