import { spawn, ChildProcess } from 'child_process';
import path from 'path';

// Resolve the path to the Next.js binary within the project.
const nextBinary = path.resolve(__dirname, '../../node_modules/.bin/next');

// Spawn the Next.js server without detaching so the parent can reap it.
const nextProcess: ChildProcess = spawn(nextBinary, ['start'], {
  stdio: 'inherit',
  detached: false,
  cwd: path.resolve(__dirname, '..'),
});

// Log any spawn errors and exit with failure status.
nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js server:', err);
  // Ensure the parent process exits with a non‑zero code to signal failure.
  process.exit(1);
});

// When the Next.js process exits, propagate its exit code to the parent process.
// If the process was terminated by a signal, treat it as a failure (non‑zero exit).
nextProcess.on('exit', (code, signal) => {
  if (signal) {
    console.log(`Next.js process terminated by signal ${signal}`);
    process.exit(1);
    return;
  }
  // Exit the parent with the same code (or 0 if undefined).
  process.exit(code ?? 0);
});

// Ensure the child process is terminated when the parent receives termination signals.
let forcedKillTimeout: NodeJS.Timeout | null = null;

const terminateChild = () => {
  if (!nextProcess.killed) {
    // Attempt graceful shutdown.
    nextProcess.kill('SIGTERM');
    // If the child does not exit within 5 seconds, force kill.
    forcedKillTimeout = setTimeout(() => {
      if (!nextProcess.killed) {
        nextProcess.kill('SIGKILL');
      }
    }, 5_000);
  }
};

process.on('SIGINT', terminateChild);
process.on('SIGTERM', terminateChild);
process.on('exit', terminateChild);

// Cleanup the forced‑kill timeout if the child exits normally.
nextProcess.on('exit', () => {
  if (forcedKillTimeout) {
    clearTimeout(forcedKillTimeout);
    forcedKillTimeout = null;
  }
});

// ---------------------------------------------------------------------------
// TanStack server entry (restored).
// This placeholder satisfies the expected export for TanStack server integrations.
// Replace with the actual implementation as needed.
export const handler = async (event: any) => {
  return {
    statusCode: 200,
    body: 'TanStack server entry placeholder',
  };
};
