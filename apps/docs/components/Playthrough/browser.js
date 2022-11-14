import React from "react";
import {
  Button,
  Launching,
  Login,
  NewProject,
  ProjectDetails,
} from "./supabase-website";

export function Browser({ screen, onEvent, url }) {
  return (
    <BrowserChrome url={url}>
      <div
        style={{
          display: "grid",
          placeItems: "center",
          height: "100%",
          color: "white",
          textAlign: "center",
        }}
      >
        {screen === "login" && <Login onEvent={onEvent} />}
        {screen === "new project" && <NewProject onEvent={onEvent} />}
        {screen === "project details" && <ProjectDetails onEvent={onEvent} />}
        {screen === "launch database" && <Launching onEvent={onEvent} />}
        {screen === "go to editor" && (
          <Button onEvent={onEvent} text="SQL Editor" />
        )}
        {screen === "editor" && (
          <Button onEvent={onEvent} text="User Management Starter" />
        )}
        {screen === "query" && <Button onEvent={onEvent} text="Run" />}
      </div>
    </BrowserChrome>
  );
}

function BrowserChrome({ url, children }) {
  return (
    <div style={{ display: "flex", flexFlow: "column", height: "100%" }}>
      <div
        style={{
          height: 24,
          display: "flex",
          background: "#000",
          width: "100%",
          alignItems: "center",
          gap: 2,
        }}
      >
        <BackArrow />
        <ForwardArrow />
        <Refresh />
        <div
          style={{
            flex: 1,
            background: "#222",
            height: 18,
            borderRadius: 4,
            lineHeight: "18px",
            padding: "0 12px",
            margin: "0 8px",
            color: "#ddd",
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function BackArrow() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
    >
      <path fill="white" fillRule="evenodd" d="M5.5 8l5.5 5.5V2L5.5 7.5V8z" />
    </svg>
  );
}

function ForwardArrow() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
    >
      <path fill="white" fillRule="evenodd" d="M10.5 8L5 2.5v11L10.5 8z" />
    </svg>
  );
}

function Refresh() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
    >
      <path
        fill="white"
        fillRule="evenodd"
        d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 1a5.5 5.5 0 110 11 5.5 5.5 0 010-11zm-1.5 4.5h1.5v3.5l3.5-3.5H9V5H7v1.5z"
      />
    </svg>
  );
}
