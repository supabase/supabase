import React, { forwardRef } from "react";
import { Editor } from "./editor";
import { FilesPanel } from "./FilesPanel";
import { serverWatcher } from "./container";
import { XTerm } from "./terminal";
import { useSubscription } from "./watcher";
import { stopServer } from "./runner";
import { setCurrentPath } from "./file-system";
import { ClipboardCopyIcon } from "@radix-ui/react-icons";

export function GoToFile({ path }) {
  return (
    <button
      className="underline decoration-green-400 decoration-dotted underline-offset-[3px]"
      onClick={() => setCurrentPath(path)}
    >
      {path.startsWith("/") ? path.slice(1) : path}
    </button>
  );
}

export function Code({ children }) {
  return (
    <pre className="overflow-auto bg-neutral-700 rounded p-2 relative my-1">
      <button
        className="absolute right-2 top-2 hover:text-green-300"
        onClick={() => copy(children)}
      >
        <ClipboardCopyIcon height={18} width={18} />
      </button>
      <code>{children}</code>
    </pre>
  );
}

function copy(text) {
  navigator.clipboard.writeText(text);
}

export const Console = forwardRef((props, ref) => {
  const serverUrl = useSubscription(serverWatcher);

  return (
    <div className="flex flex-col h-full gap-3" style={{ colorScheme: "dark" }}>
      <File />

      {serverUrl ? (
        <div
          className={` rounded overflow-hidden`}
          style={{ background: "#232323" }}
        >
          <div className="text-neutral-300  px-2 py-1 text-smn justify-between flex">
            <span />
            <span className="rounded bg-neutral-900 px-3 text-neutral-400">
              {serverUrl}
            </span>
            <button onClick={() => stopServer()}>Stop</button>
          </div>
          <iframe src={serverUrl} className="border-none h-96 w-full" />
        </div>
      ) : null}
      <div
        className={`${serverUrl ? "hidden" : "block"} rounded overflow-hidden`}
        style={{ background: "#232323" }}
      >
        <div className="text-gray-300 px-2 py-1 text-sm">Terminal</div>
        <XTerm className="h-96 pl-2" />
      </div>
    </div>
  );
});

function File() {
  return (
    <div className="flex-1  flex min-h-0 rounded overflow-hidden">
      <FilesPanel />
      <Editor className="w-full h-full  text-white min-w-0" />
    </div>
  );
}
