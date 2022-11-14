import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";

const terminal = new Terminal({
  cursorBlink: true,
  allowProposedApi: true,
  theme: {
    background: "#232323",
    white: "#abb2bf",
    green: "#98c379",
    yellow: "#e5c07b",
    blue: "#61afef",
    magenta: "#c678dd",
    cyan: "#56b6c2",
    red: "#e06c75",
    foreground: "#abb2bf",
    black: "#282c34",
    brightWhite: "#abb2bf",
    cursor: "#abb2bf",
    cursorAccent: "#abb2bf",
  },
});

const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);
terminal.write("$ ");

export function attachTerminal(element: HTMLElement) {
  terminal.open(element);
  fitAddon.fit();
  return terminal;
}
